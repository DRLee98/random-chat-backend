import { Field, ObjectType, OmitType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@ObjectType()
class MeDetail extends OmitType(
  User,
  ['socialId', 'rooms', 'messages'],
  ObjectType,
) {}

@ObjectType()
export class MeDetailOutput extends CoreOutput {
  @Field(() => MeDetail, { nullable: true })
  me?: MeDetail;
}
