import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutPut } from 'src/common/dtos/output.dto';
import { User } from 'src/user/entites/user.entity';

@InputType()
export class LoginInput extends PickType(User, [
  'socialId',
  'socialPlatform',
]) {}

@ObjectType()
export class LoginOutput extends CoreOutPut {
  @Field(() => String, { nullable: true })
  token?: string;
}
