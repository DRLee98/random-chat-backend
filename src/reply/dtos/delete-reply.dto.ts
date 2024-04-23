import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Reply } from '../entities/reply.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteReplyInput extends PickType(Reply, ['id']) {}

@ObjectType()
export class DeleteReplyOutput extends CoreOutput {}
