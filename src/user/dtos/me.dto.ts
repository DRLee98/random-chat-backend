import { Field, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutPut } from 'src/common/dtos/output.dto';
import { User } from '../entites/user.entity';

export class Me extends PickType(User, [
  'nickname',
  'bio',
  'profileUrl',
  'allowMessage',
]) {}

@ObjectType()
export class MeOutput extends CoreOutPut {
  @Field(() => Me, { nullable: true })
  me?: Me;
}
