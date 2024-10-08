import { Field, ID, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { UserRoom } from '../entities/user-room.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class RoomDetailInput {
  @Field(() => ID)
  roomId: string;
}

@ObjectType()
export class SimpleUserRoom extends OmitType(
  UserRoom,
  ['user', 'room'],
  ObjectType,
) {}

@ObjectType()
export class RoomDetail {
  @Field(() => SimpleUserRoom)
  userRoom: SimpleUserRoom;

  @Field(() => [User])
  users: User[];
}

@ObjectType()
export class RoomDetailOutput extends CoreOutput {
  @Field(() => RoomDetail, { nullable: true })
  room?: RoomDetail;
}
