import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomResolver } from './room.resolver';
import { RoomService } from './room.service';

import { UserModule } from 'src/user/user.module';
import { MessageModule } from 'src/message/message.module';
import { NotificationModule } from 'src/notification/notification.module';

import { Room } from './entities/room.entity';
import { UserRoom } from './entities/user-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    TypeOrmModule.forFeature([UserRoom]),
    UserModule,
    forwardRef(() => MessageModule),
    NotificationModule,
  ],
  providers: [RoomResolver, RoomService],
  exports: [RoomService],
})
export class RoomModule {}
