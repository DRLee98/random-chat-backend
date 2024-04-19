import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Notice } from '../entites/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteNoticeInput extends PickType(Notice, ['id']) {}

@ObjectType()
export class DeleteNoticeOutput extends CoreOutput {}
