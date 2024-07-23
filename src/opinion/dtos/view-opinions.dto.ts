import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Opinion } from '../entities/opinion.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class ViewOpinionsInput extends PaginationInput {
  @Field(() => String)
  password: string;
}

@ObjectType()
export class ViewOpinionsOutput extends PaginationOutput {
  @Field(() => [Opinion], { nullable: true })
  opinions?: Opinion[];
}
