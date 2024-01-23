import { Field, ObjectType, PickType } from '@nestjs/graphql';
import { MyRoom } from './my-rooms.dto';

@ObjectType()
export class UpdateNewMessageInUserRoom extends PickType(
  MyRoom,
  ['id', 'newMessage', 'lastMessage'],
  ObjectType,
) {
  @Field(() => String)
  userId: string;
}
