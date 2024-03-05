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
  PickType(UserRoom, ['name', 'noti', 'pinned']),
) {
  @Field(() => Number)
  userRoomId: number;
}

@ObjectType()
export class UpdateRoomOutput extends CoreOutput {}
