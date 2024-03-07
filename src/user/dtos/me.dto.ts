import { Field, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entites/user.entity';

@ObjectType()
class Me extends PickType(User, ['id', 'nickname', 'profileUrl'], ObjectType) {}

@ObjectType()
export class MeOutput extends CoreOutput {
  @Field(() => Me, { nullable: true })
  me?: Me;
}
