import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Comment } from '../entities/comment.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteCommentInput extends PickType(Comment, ['id']) {}

@ObjectType()
export class DeleteCommentOutput extends CoreOutput {}
