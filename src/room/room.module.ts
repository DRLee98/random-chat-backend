import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entites/room.entity';
import { UserRoom } from './entites/user-room.entity';
import { RoomResolver } from './room.resolver';
import { RoomService } from './room.service';
import { UserModule } from 'src/user/user.module';
import { MessageModule } from 'src/message/message.module';

@Module({
  exports: [RoomService],
  imports: [
    TypeOrmModule.forFeature([Room]),
    TypeOrmModule.forFeature([UserRoom]),
    UserModule,
    forwardRef(() => MessageModule),
  ],
  providers: [RoomResolver, RoomService],
})
export class RoomModule {}
