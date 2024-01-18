import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entites/message.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
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
}
