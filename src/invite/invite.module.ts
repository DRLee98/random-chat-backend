import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InviteResolver } from './invite.resolver';
import { InviteService } from './invite.service';

import { UserModule } from 'src/user/user.module';
import { RoomModule } from 'src/room/room.module';
import { NotificationModule } from 'src/notification/notification.module';

import { Invite } from './entities/invite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite]),
    UserModule,
    RoomModule,
    NotificationModule,
  ],
  providers: [InviteResolver, InviteService],
})
export class InviteModule {}
