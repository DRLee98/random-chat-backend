import { Field, ID, ObjectType, PickType } from '@nestjs/graphql';
import { Invite } from '../entities/invite.entity';

@ObjectType()
export class UpdateInviteStatus extends PickType(
  Invite,
  ['id', 'status'],
  ObjectType,
) {
  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  roomId: string;
}
