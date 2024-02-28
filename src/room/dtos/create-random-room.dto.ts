import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { MyRoom } from './my-rooms.dto';

@ObjectType()
export class CreateRandomRoomOutput extends CoreOutput {
  @Field(() => MyRoom, { nullable: true })
  room?: MyRoom;
}
