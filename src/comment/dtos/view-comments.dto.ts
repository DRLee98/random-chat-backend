import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Comment } from '../entities/comment.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class ViewCommentsInput extends PaginationInput {
  @Field(() => ID)
  postId: string;
}

@ObjectType()
export class ViewCommentsOutput extends PaginationOutput {
  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];
}
