import {
  Field,
  ID,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { Notice } from '../entities/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class EditNoticeInput extends PartialType(
  PickType(Notice, ['title', 'content', 'pinned', 'category']),
) {
  @Field(() => ID)
  id: string;
}

@ObjectType()
export class EditNoticeOutput extends CoreOutput {
  @Field(() => Notice, { nullable: true })
  notice?: Notice;
}
