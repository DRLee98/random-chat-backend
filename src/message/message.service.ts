import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Not, Repository } from 'typeorm';

import { UserService } from 'src/user/user.service';
import { RoomService } from 'src/room/room.service';
import { FcmService } from 'src/fcm/fcm.service';
import { CommonService } from 'src/common/common.service';

import { Message, MessageType } from './entites/message.entity';
import { User } from 'src/user/entites/user.entity';

import {
  ViewMessagesInput,
  ViewMessagesOutput,
} from './dtos/view-messages.dto';
import { SendMessageInput, SendMessageOutput } from './dtos/send-message.dto';

import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from 'src/common/common.constants';
import { NEW_MESSAGE, READ_MESSAGE } from './message.constants';
import { getDayStr } from './utils';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly userService: UserService,
    private readonly roomService: RoomService,
    private readonly fcmService: FcmService,
    private readonly commonService: CommonService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async findLastMessage(roomId: string) {
    const lastMessage = await this.messageRepository.findOne({
      where: {
        room: {
          id: roomId,
        },
      },
      order: {
        updatedAt: 'DESC',
      },
    });
    return lastMessage;
  }

  async viewMessages(
    input: ViewMessagesInput,
    user: User,
  ): Promise<ViewMessagesOutput> {
    try {
      const existRoom = await this.roomService.checkValidRoom(
        input.roomId,
        user.id,
      );

      if (!existRoom)
        return this.commonService.error(
          '참여중인 방의 메시지만 조회가 가능합니다.',
        );

      const messages = await this.messageRepository.find({
        select: {
          user: {
            id: true,
            nickname: true,
            profileUrl: true,
          },
        },
        where: {
          room: {
            id: input.roomId,
          },
        },
        relations: {
          user: true,
        },
        order: {
          createdAt: 'DESC',
        },
        ...this.commonService.paginationOption(input),
      });

      await this.roomService.resetNewMessageInUserRoom(input.roomId, user.id);
      await this.readMessage(input.roomId, user.id);

      const output = await this.commonService.paginationOutput(
        input,
        this.messageRepository,
        {
          room: {
            id: input.roomId,
          },
        },
      );
      return {
        messages: messages.reverse(),
        ...output,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async sendMessage(
    input: SendMessageInput,
    user: User,
  ): Promise<SendMessageOutput> {
    try {
      const existRoom = await this.roomService.checkValidRoom(
        input.roomId,
        user.id,
      );

      if (!existRoom)
        return this.commonService.error(
          '참여중인 방에만 메시지를 보낼 수 있습니다.',
        );

      const lastMessage = await this.findLastMessage(input.roomId);
      if (
        !lastMessage ||
        lastMessage.createdAt.toDateString() !== new Date().toDateString()
      ) {
        await this.createDateSystemMessage(input.roomId, user);
      }

      const message = this.messageRepository.create({
        contents: input.contents,
        type: input.type,
        user,
        room: {
          id: input.roomId,
        },
        readUsersId: [user.id],
      });

      await this.messageRepository.save(message);

      this.pubSub.publish(NEW_MESSAGE, {
        newMessage: message,
      });
      this.readMessage(input.roomId, user.id);
      this.fcmPushMessage(input.roomId, user.id, input.contents);

      this.roomService.updateRoomUpdateAt(input.roomId);
      this.roomService.updateNewMesssageInUserRoom(
        input.roomId,
        user.id,
        input.contents,
      );

      return {
        ok: true,
        message,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async readMessage(roomId: string, userId: string) {
    const messages = await this.messageRepository.find({
      select: {
        id: true,
        readUsersId: true,
      },
      where: {
        room: {
          id: roomId,
        },
        readUsersId: Not(ArrayContains([userId])),
        type: Not(MessageType.SYSTEM),
      },
    });

    const newMessages = await Promise.all(
      messages.map(async (message) => {
        const newMessage = {
          ...message,
          readUsersId: [...message.readUsersId, userId],
        };
        await this.messageRepository.save(newMessage);
        return { id: newMessage.id, readUsersId: newMessage.readUsersId };
      }),
    );

    if (newMessages.length > 0) {
      this.pubSub.publish(READ_MESSAGE, {
        readMessage: { messages: newMessages, roomId, userId },
      });
    }

    return newMessages;
  }

  async deleteMessages(roomId: string) {
    try {
      const messages = await this.messageRepository.find({
        where: {
          room: {
            id: roomId,
          },
        },
      });

      await this.messageRepository.softDelete(messages.map(({ id }) => id));

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async createSystemMessage(
    roomId: string,
    contents: string,
    user: User,
    publish: boolean = true,
  ) {
    const message = this.messageRepository.create({
      contents,
      type: MessageType.SYSTEM,
      user,
      room: {
        id: roomId,
      },
      readUsersId: [],
    });

    await this.messageRepository.save(message);

    if (publish) {
      await this.pubSub.publish(NEW_MESSAGE, {
        newMessage: message,
      });
    }
  }

  async createDateSystemMessage(roomId: string, user: User) {
    const newDate = new Date();
    const contents = `${newDate.getFullYear()}년 ${
      newDate.getMonth() + 1
    }월 ${newDate.getDate()}일 ${getDayStr(newDate.getDay())}`;
    await this.createSystemMessage(roomId, contents, user, false);
  }

  async fcmPushMessage(roomId: string, userId: string, message: string) {
    const allowed = await this.roomService.notiAllowRoom(roomId, userId);
    if (!allowed) return;

    const users = await this.userService.findUserByRoomId(
      roomId,
      {
        select: {
          fcmToken: true,
          noti: true,
        },
      },
      [userId],
    );
    users.forEach(({ fcmToken, noti }) => {
      if (fcmToken && noti) {
        this.fcmService.pushMessage({
          token: fcmToken,
          title: '새로운 메시지가 도착했습니다.',
          message,
        });
      }
    });
  }
}
