import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class ReplyCountInput {
  @Field(() => ID)
  commentId: string;
}

@ObjectType()
export class ReplyCountOutput extends CoreOutput {
  @Field(() => Number, { nullable: true })
  count?: number;
}
