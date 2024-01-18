import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entites/message.entity';
import { Repository } from 'typeorm';
import {
  ViewMessagesInput,
  ViewMessagesOutput,
} from './dtos/view-messages.dto';
import { User } from 'src/user/entites/user.entity';
import { RoomService } from 'src/room/room.service';
import { SendMessageInput, SendMessageOutput } from './dtos/send-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private roomeService: RoomService,
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
      const existRoom = await this.roomeService.checkValidRoom(
        input.roomId,
        user.id,
      );

      if (!existRoom) {
        return {
          ok: false,
          error: '참여중인 방의 메시지만 조회가 가능합니다.',
        };
      }

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
        skip: (input.page - 1) * input.take,
        take: input.take,
      });

      const totalPages = Math.ceil(
        (await this.messageRepository.count({
          where: {
            room: {
              id: input.roomId,
            },
          },
        })) / input.take,
      );

      return {
        ok: true,
        messages,
        totalPages,
        hasNextPage: input.page < totalPages,
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  async sendMessage(
    input: SendMessageInput,
    user: User,
  ): Promise<SendMessageOutput> {
    try {
      const existRoom = await this.roomeService.checkValidRoom(
        input.roomId,
        user.id,
      );

      if (!existRoom) {
        return {
          ok: false,
          error: '참여중인 방의 메시지만 조회가 가능합니다.',
        };
      }

      const message = this.messageRepository.create({
        contents: input.contents,
        type: input.type,
        user,
        room: {
          id: input.roomId,
        },
      });

      await this.messageRepository.save(message);
      this.roomeService.incNewMesssageCount(input.roomId, user.id);

      return {
        ok: true,
        messageId: message.id,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}
