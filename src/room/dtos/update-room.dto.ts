import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { UserRoom } from '../entites/user-room.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class UpdateRoomInput extends PartialType(
  PickType(UserRoom, ['name', 'noti']),
) {
  @Field(() => Number)
  userRoomId: number;

  @Field(() => Boolean, { nullable: true })
  pinned?: boolean;
}

@ObjectType()
export class UpdateRoomOutput extends CoreOutput {}
