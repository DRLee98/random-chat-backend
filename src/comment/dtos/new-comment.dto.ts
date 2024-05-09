import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class NewCommentInput {
  @Field(() => ID)
  postId: string;
}
