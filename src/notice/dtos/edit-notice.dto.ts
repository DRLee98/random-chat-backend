import { Field, ID, PartialType, PickType } from '@nestjs/graphql';
import { Notice } from '../entities/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

export class EditNoticeInput extends PartialType(
  PickType(Notice, ['title', 'content', 'pinned']),
) {
  @Field(() => ID)
  id: string;
}

export class EditNoticeOutput extends CoreOutput {
  @Field(() => Notice, { nullable: true })
  notice?: Notice;
}
