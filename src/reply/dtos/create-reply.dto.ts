import { Field, ID, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Reply } from '../entities/reply.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateReplyInput extends PickType(Reply, ['text']) {
  @Field(() => ID)
  commentId: string;
}

@ObjectType()
export class CreateReplyOutput extends CoreOutput {
  @Field(() => Reply, { nullable: true })
  reply?: Reply;
}
