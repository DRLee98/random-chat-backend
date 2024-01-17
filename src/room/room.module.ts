import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entites/room.entity';
import { UserRoom } from './entites/user-room.entity';
import { RoomResolver } from './room.resolver';
import { RoomService } from './room.service';
import { User } from 'src/user/entites/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    TypeOrmModule.forFeature([UserRoom]),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [RoomResolver, RoomService],
})
export class RoomModule {}
