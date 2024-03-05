import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entites/message.entity';
import { ArrayContains, Not, Repository } from 'typeorm';
import {
  ViewMessagesInput,
  ViewMessagesOutput,
} from './dtos/view-messages.dto';
import { User } from 'src/user/entites/user.entity';
import { RoomService } from 'src/room/room.service';
import { SendMessageInput, SendMessageOutput } from './dtos/send-message.dto';
import { CommonService } from 'src/common/common.service';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from 'src/common/common.constants';
import { NEW_MESSAGE, READ_MESSAGE } from './message.constants';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly commonService: CommonService,
    private readonly roomService: RoomService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async findLastMessage(roomId: number) {
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
    return lastMessage?.contents ?? '';
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
      await this.roomService.updateNewMesssageInUserRoom(
        input.roomId,
        user.id,
        input.contents,
      );

      await this.pubSub.publish(NEW_MESSAGE, {
        newMessage: message,
      });

      return {
        ok: true,
        messageId: message.id,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async readMessage(roomId: number, userId: number) {
    const messages = await this.messageRepository.find({
      where: {
        room: {
          id: roomId,
        },
        readUsersId: Not(ArrayContains([userId])),
      },
    });

    const newMessages = await Promise.all(
      messages.map(async (message) => {
        message.readUsersId.push(userId);
        await this.messageRepository.save(message);
        return { id: message.id, readUsersId: message.readUsersId };
      }),
    );

    if (newMessages.length > 0) {
      this.pubSub.publish(READ_MESSAGE, {
        readMessage: { messages: newMessages, roomId, userId },
      });
    }

    return newMessages;
  }

  async deleteMessages(roomId: number) {
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
}
