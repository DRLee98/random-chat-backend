import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Notice, NoticeCategory } from '../entites/notice.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class NoticeListInput extends PaginationInput {
  @Field(() => NoticeCategory, { nullable: true })
  category?: NoticeCategory;
}

@ObjectType()
export class NoticeListOutput extends PaginationOutput {
  @Field(() => [Notice], { nullable: true })
  noticeList?: Notice[];
}
