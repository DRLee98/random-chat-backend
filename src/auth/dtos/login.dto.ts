import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from 'src/user/entites/user.entity';
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
}
