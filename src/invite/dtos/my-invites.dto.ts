import { Field, ObjectType, OmitType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Room } from 'src/room/entities/room.entity';

@ObjectType()
export class InviteRoom extends OmitType(
  Room,
  ['userRooms', 'messages'],
  ObjectType,
) {}

@ObjectType()
export class MyInvitesOutput extends CoreOutput {
  @Field(() => [InviteRoom], { nullable: true })
  rooms?: InviteRoom[];
}
