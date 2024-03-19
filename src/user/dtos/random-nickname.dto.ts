import { ObjectType, Field } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
export class RandomNicknameOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  nickname?: string;
}
