import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NoticeResolver } from './notice.resolver';
import { NoticeService } from './notice.service';

import { Notice } from './entites/notice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notice])],
  providers: [NoticeResolver, NoticeService],
})
export class NoticeModule {}
