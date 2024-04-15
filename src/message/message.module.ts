import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';

import { UserModule } from 'src/user/user.module';
import { RoomModule } from 'src/room/room.module';
import { FcmModule } from 'src/fcm/fcm.module';

import { Message } from './entites/message.entity';

@Module({
  exports: [MessageService],
  imports: [
    TypeOrmModule.forFeature([Message]),
    UserModule,
    RoomModule,
    FcmModule,
  ],
  providers: [MessageResolver, MessageService],
})
export class MessageModule {}
