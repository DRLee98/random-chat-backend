import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Notice } from '../entities/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class NoticeInput extends PickType(Notice, ['id']) {}

@ObjectType()
export class NoticeOutput extends CoreOutput {
  @Field(() => Notice, { nullable: true })
  notice?: Notice;
}
