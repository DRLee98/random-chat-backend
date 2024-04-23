import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Comment } from '../entities/comment.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class EditCommentInput extends PickType(Comment, ['id', 'text']) {}

@ObjectType()
export class EditCommentOutput extends CoreOutput {
  @Field(() => Comment, { nullable: true })
  comment?: Comment;
}
