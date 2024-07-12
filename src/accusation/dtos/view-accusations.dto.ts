import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Accusation } from '../entities/accusation.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class ViewAccusationsInput extends PaginationInput {
  @Field(() => String)
  password: string;
}

@ObjectType()
export class ViewAccusationsOutput extends PaginationOutput {
  @Field(() => [Accusation], { nullable: true })
  accusations?: Accusation[];
}
