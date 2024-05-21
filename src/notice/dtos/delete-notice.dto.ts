import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Notice } from '../entities/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteNoticeInput extends PickType(Notice, ['id']) {
  @Field(() => String)
  password: string;
}

@ObjectType()
export class DeleteNoticeOutput extends CoreOutput {}
