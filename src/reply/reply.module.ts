import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReplyResolver } from './reply.resolver';
import { ReplyService } from './reply.service';

import { Reply } from './entities/reply.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reply])],
  providers: [ReplyResolver, ReplyService],
  exports: [ReplyService],
})
export class ReplyModule {}
