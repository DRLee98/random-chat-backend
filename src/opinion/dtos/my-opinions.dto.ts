import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Opinion } from '../entities/opinion.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class MyOpinionsInput extends PaginationInput {}

@ObjectType()
export class MyOpinionsOutput extends PaginationOutput {
  @Field(() => [Opinion], { nullable: true })
  opinions?: Opinion[];
}
