import { Field, ID, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Message } from '../entites/message.entity';

@InputType()
export class ReadMessageInput {
  @Field(() => ID)
  roomId: string;
}

@ObjectType()
export class Messages extends PickType(
  Message,
  ['id', 'readUsersId'],
  ObjectType,
) {}

@ObjectType()
export class ReadMessage {
  @Field(() => ID)
  roomId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => [Messages])
  messages: Messages[];
}
