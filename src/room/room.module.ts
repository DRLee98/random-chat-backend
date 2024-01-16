import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entites/room.entity';
import { UserRoom } from './entites/user-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    TypeOrmModule.forFeature([UserRoom]),
  ],
})
export class RoomModule {}
