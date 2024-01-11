import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutPut } from 'src/common/dtos/output.dto';
import { User } from '../entites/user.entity';

@InputType()
export class CreateUserInput extends PickType(User, [
  'socialId',
  'socialPlatform',
]) {}

@ObjectType()
export class CreateUserOutput extends CoreOutPut {
  @Field(() => User, { nullable: true })
  user?: User;
}
