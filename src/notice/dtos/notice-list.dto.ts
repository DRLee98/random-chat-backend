import { Field } from '@nestjs/graphql';
import { Notice } from '../entities/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

export class NoticeListOutput extends CoreOutput {
  @Field(() => [Notice], { nullable: true })
  noticeList?: Notice[];
}
