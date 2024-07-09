import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from 'src/user/entities/user.entity';

@InputType()
export class InviteTargetsInput {
  @Field(() => Number)
  count: number;
}

@ObjectType()
export class InviteTargetsOutput extends CoreOutput {
  @Field(() => [User], { nullable: true })
  targets?: User[];
}
