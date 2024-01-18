import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User as UserBase } from '../entites/user.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
class User extends PickType(
  UserBase,
  ['id', 'nickname', 'bio', 'profileUrl', 'language'],
  ObjectType,
) {}

@InputType()
export class UserProfileInput extends PickType(UserBase, ['id']) {}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
  @Field(() => User, { nullable: true })
  user?: User;
}
