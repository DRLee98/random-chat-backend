import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { InviteRoom } from './my-invites.dto';

@InputType()
export class CreateInviteInput {
  @Field(() => [ID])
  targetIds: string[];
}

@ObjectType()
export class CreateInviteOutput extends CoreOutput {
  @Field(() => InviteRoom, { nullable: true })
  room?: InviteRoom;
}
