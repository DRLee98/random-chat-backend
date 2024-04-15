import { PickType } from '@nestjs/graphql';
import { Notice } from '../entities/notice.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

export class DeleteNoticeInput extends PickType(Notice, ['id']) {}

export class DeleteNoticeOutput extends CoreOutput {}
