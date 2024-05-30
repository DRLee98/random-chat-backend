import { Field, ID, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@ObjectType()
class Me extends PickType(
  User,
  ['id', 'nickname', 'profileUrl', 'profileBgColor', 'profileTextColor'],
  ObjectType,
) {
  @Field(() => [ID])
  blockUserIds: string[];
}

@ObjectType()
export class MeOutput extends CoreOutput {
  @Field(() => Me, { nullable: true })
  me?: Me;
}
