import { Field, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutPut } from 'src/common/dtos/output.dto';
import { User } from '../entites/user.entity';

class Me extends PickType(
  User,
  ['nickname', 'bio', 'profileUrl', 'allowMessage'],
  ObjectType,
) {}

@ObjectType()
export class MeOutput extends CoreOutPut {
  @Field(() => User, { nullable: true })
  me?: User;
}
