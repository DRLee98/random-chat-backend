import { Field, PickType } from '@nestjs/graphql';
import { Notice } from '../entities/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

export class CreateNoticeInput extends PickType(Notice, [
  'title',
  'content',
  'pinned',
]) {}

export class CreateNoticeOutput extends CoreOutput {
  @Field(() => Notice, { nullable: true })
  notice?: Notice;
}
