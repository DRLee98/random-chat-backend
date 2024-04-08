import { Field, ID, ObjectType, PickType } from '@nestjs/graphql';
import { MyRoom } from './my-rooms.dto';

@ObjectType()
export class UpdateNewMessageInUserRoom extends PickType(
  MyRoom,
  ['id', 'newMessage', 'lastMessage'],
  ObjectType,
) {
  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  roomId: string;
}
