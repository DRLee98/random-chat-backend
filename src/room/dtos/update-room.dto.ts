import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { UserRoom } from '../entites/user-room.entity';
import { CoreOutPut } from 'src/common/dtos/output.dto';

@InputType()
export class UpdateRoomInput extends PartialType(
  PickType(UserRoom, ['name', 'noti', 'pinned']),
) {
  @Field(() => Number)
  id: number;
}

@ObjectType()
export class UpdateRoomOutput extends CoreOutPut {}
