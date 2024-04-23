import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Reply } from '../entities/reply.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class EditReplyInput extends PickType(Reply, ['id', 'text']) {}

@ObjectType()
export class EditReplyOutput extends CoreOutput {
  @Field(() => Reply, { nullable: true })
  reply?: Reply;
}
