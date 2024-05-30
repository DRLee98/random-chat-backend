import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  PickType,
} from '@nestjs/graphql';
import { UserRoom } from '../entities/user-room.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { User } from 'src/user/entities/user.entity';

@InputType()
export class MyRoomsInput extends PaginationInput {}

@ObjectType()
export class SimpleUser extends PickType(
  User,
  ['id', 'nickname', 'profileUrl', 'profileBgColor', 'profileTextColor'],
  ObjectType,
) {}

@ObjectType()
export class MyRoom extends OmitType(UserRoom, ['user'], ObjectType) {
  @Field(() => [SimpleUser])
  users: SimpleUser[];

  @Field(() => String)
  lastMessage: string;
}

@ObjectType()
export class MyRoomsOutput extends PaginationOutput {
  @Field(() => [MyRoom], { nullable: true })
  rooms?: MyRoom[];
}
