import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { UserRoom } from '../entites/user-room.entity';

@ObjectType()
export class CreateRandomRoomOutput extends CoreOutput {
  @Field(() => UserRoom, { nullable: true })
  room?: UserRoom;
}
