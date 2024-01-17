import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutPut } from 'src/common/dtos/output.dto';
import { UserRoom } from '../entites/user-room.entity';

@ObjectType()
export class CreateRandomRoomOutput extends CoreOutPut {
  @Field(() => UserRoom, { nullable: true })
  room?: UserRoom;
}
