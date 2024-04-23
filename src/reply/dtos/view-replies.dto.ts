import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Reply } from '../entities/reply.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class ViewRepliesInput extends PaginationInput {
  @Field(() => ID)
  commentId: string;
}

@ObjectType()
export class ViewRepliesOutput extends PaginationOutput {
  @Field(() => [Reply], { nullable: true })
  replies?: Reply[];
}
