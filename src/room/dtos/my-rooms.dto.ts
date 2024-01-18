import { Field, ObjectType, OmitType } from '@nestjs/graphql';
import { CoreOutPut } from 'src/common/dtos/output.dto';
import { UserRoom } from '../entites/user-room.entity';

@ObjectType('MyRoom')
class Room extends OmitType(UserRoom, ['user'], ObjectType) {
  @Field(() => String)
  lastMessage: String;
}

@ObjectType()
export class MyRoomsOutput extends CoreOutPut {
  @Field(() => [Room], { nullable: true })
  rooms?: Room[];
}
