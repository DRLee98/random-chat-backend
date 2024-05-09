import { Inject } from '@nestjs/common';
import { Args, Resolver, Query, Mutation, Subscription } from '@nestjs/graphql';

import { CommentService } from './comment.service';

import { User } from 'src/user/entities/user.entity';
import { Comment } from './entities/comment.entity';
import { LoggedInUser } from 'src/user/user.decorator';

import {
  ViewCommentsInput,
  ViewCommentsOutput,
} from './dtos/view-comments.dto';
import {
  CommentCountInput,
  CommentCountOutput,
} from './dtos/comment-count.dto';
import {
  CreateCommentInput,
  CreateCommentOutput,
} from './dtos/create-comment.dto';
import { EditCommentInput, EditCommentOutput } from './dtos/edit-comment.dto';
import {
  DeleteCommentInput,
  DeleteCommentOutput,
} from './dtos/delete-comment.dto';
import { NewCommentInput } from './dtos/new-comment.dto';

import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { NEW_COMMNET } from './comment.constants';

@Resolver()
export class CommentResolver {
  constructor(
    private readonly commentService: CommentService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => CommentCountOutput)
  async commentCount(
    @Args('input') input: CommentCountInput,
  ): Promise<CommentCountOutput> {
    return this.commentService.commentCount(input);
  }

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

  @Subscription(() => Comment, {
    filter(payload, variables, context) {
      return (
        payload.newComment.postId === variables.input.postId &&
        payload.newComment.user.id !== context.user.id
      );
    },
    resolve(payload) {
      return payload.newComment;
    },
  })
  newComment(@Args('input') _: NewCommentInput) {
    return this.pubSub.asyncIterator(NEW_COMMNET);
  }
}
