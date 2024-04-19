import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Notice } from '../entites/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateNoticeInput extends PickType(Notice, [
  'title',
  'content',
  'pinned',
  'category',
]) {}

@ObjectType()
export class CreateNoticeOutput extends CoreOutput {
  @Field(() => Notice, { nullable: true })
  notice?: Notice;
}
