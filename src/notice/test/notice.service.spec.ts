import { Test } from '@nestjs/testing';
import { NoticeService } from '../notice.service';
import { CommonService } from 'src/common/common.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository, mockRepository } from 'test/utils';
import { Notice } from '../entities/notice.entity';

const mockNotice: Notice = {
  id: '1',
  title: 'title',
  content: 'content',
  pinned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('NoticeService 테스트', () => {
  let noticeService: NoticeService;
  let noticeRepository: MockRepository<Notice>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NoticeService,
        {
          provide: getRepositoryToken(Notice),
          useValue: mockRepository(),
        },
        CommonService,
      ],
    }).compile();

    noticeService = module.get(NoticeService);
    noticeRepository = module.get(getRepositoryToken(Notice));
  });

  it('서비스 health check ', () => {
    expect(noticeService).toBeDefined();
    expect(noticeRepository).toBeDefined();
  });

  it('공지사항 목록 조회 테스트', async () => {
    const noticeList = [mockNotice];
    noticeRepository.find.mockResolvedValue(noticeList);

    const result = await noticeService.noticeList({ take: 20, skip: 0 });

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.noticeList).toEqual(noticeList);

    expect(noticeRepository.find).toHaveBeenCalledTimes(1);
  });

  describe('공지사항 조회 테스트', () => {
    it('존재하지 않는 공지사항인 경우', async () => {
      noticeRepository.findOne.mockResolvedValue(null);

      const result = await noticeService.notice({ id: 'xx' });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('공지사항 조회', async () => {
      noticeRepository.findOne.mockResolvedValue(mockNotice);

      const result = await noticeService.notice({ id: mockNotice.id });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.notice).toEqual(mockNotice);

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  it('공지사항 생성 테스트', async () => {
    noticeRepository.create.mockReturnValue(mockNotice);
    noticeRepository.save.mockResolvedValue(mockNotice);

    const result = await noticeService.createNotice({
      title: mockNotice.title,
      content: mockNotice.content,
      pinned: mockNotice.pinned,
    });

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.notice).toEqual(mockNotice);

    expect(noticeRepository.create).toHaveBeenCalledTimes(1);
    expect(noticeRepository.save).toHaveBeenCalledTimes(1);
  });

  describe('공지사항 수정 테스트', () => {
    it('존재하지 않는 공지사항인 경우', async () => {
      noticeRepository.findOne.mockResolvedValue(null);

      const result = await noticeService.editNotice({ id: 'xx' });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('공지사항 수정', async () => {
      const updateTitle = 'update title';
      noticeRepository.findOne.mockResolvedValue(mockNotice);

      const result = await noticeService.editNotice({
        id: mockNotice.id,
        title: updateTitle,
      });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.notice).toEqual({ ...mockNotice, title: updateTitle });

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
      expect(noticeRepository.update).toHaveBeenCalledTimes(1);
      expect(noticeRepository.update).toHaveBeenCalledWith(
        { id: mockNotice.id },
        { title: updateTitle },
      );
    });
  });

  describe('공지사항 삭제 테스트', () => {
    it('존재하지 않는 공지사항인 경우', async () => {
      noticeRepository.findOne.mockResolvedValue(null);

      const result = await noticeService.deleteNotice({ id: 'xx' });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('공지사항 삭제', async () => {
      noticeRepository.findOne.mockResolvedValue(mockNotice);

      const result = await noticeService.deleteNotice({ id: mockNotice.id });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
      expect(noticeRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(noticeRepository.softDelete).toHaveBeenCalledWith({
        id: mockNotice.id,
      });
    });
  });
});
