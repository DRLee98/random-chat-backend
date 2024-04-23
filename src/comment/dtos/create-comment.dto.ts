import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Comment } from '../entities/comment.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateCommentInput extends PickType(Comment, ['text', 'postId']) {}

@ObjectType()
export class CreateCommentOutput extends CoreOutput {
  @Field(() => Comment, { nullable: true })
  comment?: Comment;
}
