import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class LoginInput extends PickType(User, [
  'socialId',
  'socialPlatform',
]) {}

@ObjectType()
export class LoginOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  token?: string;

  @Field(() => Boolean, { nullable: true })
  suspended?: boolean;
}
