import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Notice } from '../entities/notice.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class NoticeListInput extends PaginationInput {}

@ObjectType()
export class NoticeListOutput extends PaginationOutput {
  @Field(() => [Notice], { nullable: true })
  noticeList?: Notice[];
}
