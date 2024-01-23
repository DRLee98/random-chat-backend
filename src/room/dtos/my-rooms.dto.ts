import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { UserRoom } from '../entites/user-room.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class MyRoomsInput extends PaginationInput {}

@ObjectType()
export class MyRoom extends OmitType(UserRoom, ['user'], ObjectType) {
  @Field(() => String)
  lastMessage: String;
}

@ObjectType()
export class MyRoomsOutput extends PaginationOutput {
  @Field(() => [MyRoom], { nullable: true })
  rooms?: MyRoom[];
}
