import { Field, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entites/user.entity';

@ObjectType()
class Me extends PickType(
  User,
  [
    'nickname',
    'bio',
    'profileUrl',
    'allowMessage',
    'language',
    'autoTranslation',
  ],
  ObjectType,
) {}

@ObjectType()
export class MeOutput extends CoreOutput {
  @Field(() => Me, { nullable: true })
  me?: Me;
}
