import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OpinionResolver } from './opinion.resolver';
import { OpinionService } from './opinion.service';

import { AwsModule } from 'src/aws/aws.module';
import { CommentModule } from 'src/comment/comment.module';

import { Opinion } from './entities/opinion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Opinion]), AwsModule, CommentModule],
  providers: [OpinionResolver, OpinionService],
})
export class OpinionModule {}
