import { Args, Resolver, Query, Mutation } from '@nestjs/graphql';

import { CommentService } from './comment.service';

import { User } from 'src/user/entities/user.entity';
import { LoggedInUser } from 'src/user/user.decorator';

import {
  ViewCommentsInput,
  ViewCommentsOutput,
} from './dtos/view-comments.dto';
import {
  CreateCommentInput,
  CreateCommentOutput,
} from './dtos/create-comment.dto';
import { EditCommentInput, EditCommentOutput } from './dtos/edit-comment.dto';
import {
  DeleteCommentInput,
  DeleteCommentOutput,
} from './dtos/delete-comment.dto';

@Resolver()
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

  @Query(() => ViewCommentsOutput)
  async viewComments(
    @Args('input') input: ViewCommentsInput,
  ): Promise<ViewCommentsOutput> {
    return this.commentService.viewComments(input);
  }

  @Mutation(() => CreateCommentOutput)
  async createComment(
    @Args('input') input: CreateCommentInput,
    @LoggedInUser() user: User,
  ): Promise<CreateCommentOutput> {
    return this.commentService.createComment(input, user);
  }

  @Mutation(() => EditCommentOutput)
  async editComment(
    @Args('input') input: EditCommentInput,
    @LoggedInUser() user: User,
  ): Promise<EditCommentOutput> {
    return this.commentService.editComment(input, user);
  }

  @Mutation(() => DeleteCommentOutput)
  async deleteComment(
    @Args('input') input: DeleteCommentInput,
    @LoggedInUser() user: User,
  ): Promise<DeleteCommentOutput> {
    return this.commentService.deleteComment(input, user);
  }
}
