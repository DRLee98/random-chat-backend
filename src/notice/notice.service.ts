import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommonService } from 'src/common/common.service';

import { Notice } from './entities/notice.entity';

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

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    private readonly commonService: CommonService,
  ) {}
  async noticeList({
    category,
    ...input
  }: NoticeListInput): Promise<NoticeListOutput> {
    try {
      const noticeList = await this.noticeRepository.find({
        where: {
          category,
        },
        order: {
          pinned: {
            direction: 'DESC',
            nulls: 'LAST',
          },
          createdAt: 'DESC',
        },
        ...this.commonService.paginationOption(input),
      });

      const output = await this.commonService.paginationOutput(
        input,
        this.noticeRepository,
        { category },
      );
      return {
        noticeList,
        ...output,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async notice({ id }: NoticeInput): Promise<NoticeOutput> {
    try {
      const notice = await this.noticeRepository.findOne({ where: { id } });
      if (!notice) {
        return this.commonService.error('존재하지 않는 공지사항입니다.');
      }

      return {
        ok: true,
        notice,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async createNotice(input: CreateNoticeInput): Promise<CreateNoticeOutput> {
    try {
      const notice = this.noticeRepository.create(input);

      await this.noticeRepository.save(notice);

      return {
        ok: true,
        notice,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async editNotice({
    id,
    ...data
  }: EditNoticeInput): Promise<EditNoticeOutput> {
    try {
      const findNotice = await this.noticeRepository.findOne({ where: { id } });
      if (!findNotice) {
        return this.commonService.error('존재하지 않는 공지사항입니다.');
      }

      await this.noticeRepository.update({ id }, { ...data });

      return {
        ok: true,
        notice: {
          ...findNotice,
          ...data,
        },
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async deleteNotice({ id }: DeleteNoticeInput): Promise<DeleteNoticeOutput> {
    try {
      const findNotice = await this.noticeRepository.findOne({ where: { id } });
      if (!findNotice) {
        return this.commonService.error('존재하지 않는 공지사항입니다.');
      }

      await this.noticeRepository.softDelete({ id });

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }
}
