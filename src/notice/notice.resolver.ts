import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';

import { NoticeService } from './notice.service';

import { NoticeListInput, NoticeListOutput } from './dtos/notice-list.dto';
import { NoticeInput, NoticeOutput } from './dtos/notice.dto';
import {
  CreateNoticeInput,
  CreateNoticeOutput,
} from './dtos/create-notice.dto';
import { EditNoticeInput, EditNoticeOutput } from './dtos/edit-notice.dto';
import {
  DeleteNoticeInput,
  DeleteNoticeOutput,
} from './dtos/delete-notice.dto';

@Resolver()
export class NoticeResolver {
  constructor(private readonly noticeService: NoticeService) {}

  @Query(() => NoticeListOutput)
  async noticeList(
    @Args('input') input: NoticeListInput,
  ): Promise<NoticeListOutput> {
    return this.noticeService.noticeList(input);
  }

  @Query(() => NoticeOutput)
  async notice(@Args('input') input: NoticeInput): Promise<NoticeOutput> {
    return this.noticeService.notice(input);
  }

  @Mutation(() => CreateNoticeOutput)
  async createNotice(
    @Args('input') input: CreateNoticeInput,
  ): Promise<CreateNoticeOutput> {
    return this.noticeService.createNotice(input);
  }

  @Mutation(() => EditNoticeOutput)
  async editNotice(
    @Args('input') input: EditNoticeInput,
  ): Promise<EditNoticeOutput> {
    return this.noticeService.editNotice(input);
  }

  @Mutation(() => DeleteNoticeOutput)
  async deleteNotice(
    @Args('input') input: DeleteNoticeInput,
  ): Promise<DeleteNoticeOutput> {
    return this.noticeService.deleteNotice(input);
  }
}
