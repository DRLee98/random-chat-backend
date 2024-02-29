import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from './output.dto';

@InputType()
export class PaginationInput {
  @Field(() => Number, { defaultValue: 1 })
  page: number;

  @Field(() => Number, { defaultValue: 30 })
  take: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field(() => Number, { nullable: true })
  currentPage?: number;

  @Field(() => Number, { nullable: true })
  totalPages?: number;

  @Field(() => Boolean, { nullable: true })
  hasNextPage?: boolean;
}
