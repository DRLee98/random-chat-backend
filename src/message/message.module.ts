import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entites/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
})
export class MessageModule {}
