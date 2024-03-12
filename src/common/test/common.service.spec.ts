import { Test } from '@nestjs/testing';
import { CommonService } from '../common.service';
import { Repository } from 'typeorm';
import { PaginationInput } from '../dtos/pagination.dto';

describe('CommonService 테스트', () => {
  let commonService: CommonService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CommonService],
    }).compile();

    commonService = module.get<CommonService>(CommonService);
  });

  it('서비스 health check ', () => {
    expect(commonService).toBeDefined();
  });

  it('error 테스트', () => {
    const message = 'error message';
    const result = commonService.error(message);

    expect(result).toEqual({
      ok: false,
      error: message,
    });
  });

  it('페이징 option 테스트', () => {
    const input: PaginationInput = { skip: 0, take: 10 };
    const result = commonService.paginationOption(input);

    expect(result).toEqual(input);
  });

  describe('페이징 output 테스트', () => {
    const input: PaginationInput = { skip: 0, take: 10 };
    const repository = {
      count: jest.fn(),
    };
    const where = { id: 'test' };

    beforeEach(() => {
      repository.count.mockClear();
    });

    it('페이징 다음 페이지 있음', async () => {
      repository.count.mockResolvedValue(100);

      const result = await commonService.paginationOutput(
        input,
        repository as unknown as Repository<unknown>,
        where,
      );

      expect(result).toEqual({
        ok: true,
        hasNext: true,
      });

      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(repository.count).toHaveBeenCalledWith({ where });
    });

    it('페이징 다음 페이지 없음', async () => {
      repository.count.mockResolvedValue(5);

      const result = await commonService.paginationOutput(
        input,
        repository as unknown as Repository<unknown>,
        where,
      );

      expect(result).toEqual({
        ok: true,
        hasNext: false,
      });

      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(repository.count).toHaveBeenCalledWith({ where });
    });
  });
});
