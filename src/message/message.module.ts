import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';

import { UserModule } from 'src/user/user.module';
import { RoomModule } from 'src/room/room.module';
import { NotificationModule } from 'src/notification/notification.module';

import { Message } from './entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    UserModule,
    RoomModule,
    NotificationModule,
  ],
  providers: [MessageResolver, MessageService],
  exports: [MessageService],
})
export class MessageModule {}
