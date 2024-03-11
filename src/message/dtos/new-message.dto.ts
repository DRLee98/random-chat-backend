import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class NewMessageInput {
  @Field(() => ID)
  roomId: string;
}
