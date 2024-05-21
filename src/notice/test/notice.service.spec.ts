import { Test } from '@nestjs/testing';
import { NoticeService } from '../notice.service';
import { CommonService } from 'src/common/common.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository, mockRepository } from 'test/utils';
import { Notice } from '../entities/notice.entity';
import { mockNotice } from 'test/mockData';
import { ConfigService } from '@nestjs/config';

const env = {
  PASSWORD: 'password',
};

const mockConfigService = () => {
  return {
    get: (key: string) => env[key],
  };
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
        {
          provide: ConfigService,
          useValue: mockConfigService(),
        },
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

  describe('공지사항 생성 테스트', () => {
    const input = {
      title: mockNotice.title,
      content: mockNotice.content,
      pinned: mockNotice.pinned,
      category: mockNotice.category,
    };

    it('비밀번호가 공백일 경우', async () => {
      const result = await noticeService.createNotice({
        password: '',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('비밀번호가 틀렸을 경우', async () => {
      const result = await noticeService.createNotice({
        password: 'xx',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('공지사항 생성', async () => {
      noticeRepository.create.mockReturnValue(mockNotice);
      noticeRepository.save.mockResolvedValue(mockNotice);

      const result = await noticeService.createNotice({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.notice).toEqual(mockNotice);

      expect(noticeRepository.create).toHaveBeenCalledTimes(1);
      expect(noticeRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('공지사항 수정 테스트', () => {
    const input = {
      id: mockNotice.id,
      title: 'update title',
    };

    it('비밀번호가 공백일 경우', async () => {
      const result = await noticeService.editNotice({
        password: '',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('비밀번호가 틀렸을 경우', async () => {
      const result = await noticeService.editNotice({
        password: 'xx',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('존재하지 않는 공지사항인 경우', async () => {
      noticeRepository.findOne.mockResolvedValue(null);

      const result = await noticeService.editNotice({
        password: env.PASSWORD,
        id: 'xx',
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('공지사항 수정', async () => {
      noticeRepository.findOne.mockResolvedValue(mockNotice);

      const result = await noticeService.editNotice({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.notice).toEqual({ ...mockNotice, title: input.title });

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
      expect(noticeRepository.update).toHaveBeenCalledTimes(1);
      expect(noticeRepository.update).toHaveBeenCalledWith(
        { id: mockNotice.id },
        { title: input.title },
      );
    });
  });

  describe('공지사항 삭제 테스트', () => {
    it('비밀번호가 공백일 경우', async () => {
      const result = await noticeService.deleteNotice({
        password: '',
        id: mockNotice.id,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('비밀번호가 틀렸을 경우', async () => {
      const result = await noticeService.deleteNotice({
        password: 'xx',
        id: mockNotice.id,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('존재하지 않는 공지사항인 경우', async () => {
      noticeRepository.findOne.mockResolvedValue(null);

      const result = await noticeService.deleteNotice({
        password: env.PASSWORD,
        id: 'xx',
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(noticeRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('공지사항 삭제', async () => {
      noticeRepository.findOne.mockResolvedValue(mockNotice);

      const result = await noticeService.deleteNotice({
        password: env.PASSWORD,
        id: mockNotice.id,
      });

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
