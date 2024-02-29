import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from './output.dto';

@InputType()
export class PaginationInput {
  @Field(() => Number, { defaultValue: 0 })
  skip: number;

  @Field(() => Number, { defaultValue: 30 })
  take: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field(() => Boolean, { nullable: true })
  hasNext?: boolean;
}
