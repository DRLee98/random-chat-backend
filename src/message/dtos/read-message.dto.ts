import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Message } from '../entites/message.entity';

@InputType()
export class ReadMessageInput {
  @Field(() => ID)
  roomId: string;
}

@ObjectType()
export class ReadMessage {
  @Field(() => ID)
  roomId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => [Message])
  messages: Message[];
}
