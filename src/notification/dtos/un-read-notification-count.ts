import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
export class UnReadNotificationCountOutput extends CoreOutput {
  @Field(() => Number, { nullable: true })
  count?: number;
}
