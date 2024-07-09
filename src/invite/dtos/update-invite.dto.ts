import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { InviteStatus } from '../entities/invite.entity';
import { MyRoom } from 'src/room/dtos/my-rooms.dto';

@InputType()
export class UpdateInviteInput {
  @Field(() => ID)
  id: string;

  @Field(() => InviteStatus)
  status: InviteStatus;
}

@ObjectType()
export class UpdateInviteOutput extends CoreOutput {
  @Field(() => MyRoom, { nullable: true })
  room?: MyRoom;
}
