import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Comment } from '../entities/comment.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CommentCountInput extends PickType(Comment, ['postId']) {}

@ObjectType()
export class CommentCountOutput extends CoreOutput {
  @Field(() => Number, { nullable: true })
  count?: number;
}
