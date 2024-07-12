import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
export class MyAccusationInfoOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  message?: string;
}
