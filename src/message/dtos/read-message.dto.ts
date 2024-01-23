import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Message } from '../entites/message.entity';

@InputType()
export class ReadMessageInput {
  @Field(() => Number)
  roomId: number;
}

@ObjectType()
export class Messages extends PickType(
  Message,
  ['id', 'readUsersId'],
  ObjectType,
) {}

@ObjectType()
export class ReadMessage {
  @Field(() => Number)
  roomId: number;

  @Field(() => Number)
  userId: number;

  @Field(() => [Messages])
  messages: Messages[];
}
