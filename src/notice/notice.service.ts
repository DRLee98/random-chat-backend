import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
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

  async createNotice({
    password,
    ...input
  }: CreateNoticeInput): Promise<CreateNoticeOutput> {
    try {
      if (!password)
        return this.commonService.error(
          '공지를 등록하기 위한 비밀번호를 입력해 주세요',
        );
      if (password !== this.configService.get('PASSWORD'))
        return this.commonService.error('비밀번호가 맞지 않습니다');

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
    password,
    id,
    ...data
  }: EditNoticeInput): Promise<EditNoticeOutput> {
    try {
      if (!password)
        return this.commonService.error(
          '공지를 수정하기 위한 비밀번호를 입력해 주세요',
        );
      if (password !== this.configService.get('PASSWORD'))
        return this.commonService.error('비밀번호가 맞지 않습니다');

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

  async deleteNotice({
    password,
    id,
  }: DeleteNoticeInput): Promise<DeleteNoticeOutput> {
    try {
      if (!password)
        return this.commonService.error(
          '공지를 삭제하기 위한 비밀번호를 입력해 주세요',
        );
      if (password !== this.configService.get('PASSWORD'))
        return this.commonService.error('비밀번호가 맞지 않습니다');

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
