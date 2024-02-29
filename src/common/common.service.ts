import { Injectable } from '@nestjs/common';
import { CoreOutput } from './dtos/output.dto';
import { PaginationInput, PaginationOutput } from './dtos/pagination.dto';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class CommonService {
  error(msg: string): CoreOutput {
    return {
      ok: false,
      error: msg,
    };
  }

  paginationOption(input: PaginationInput) {
    return {
      skip: input.skip,
      take: input.take,
    };
  }

  async paginationOutput<T>(
    input: PaginationInput,
    repository: Repository<T>,
    where: FindOptionsWhere<T>,
  ): Promise<PaginationOutput> {
    const total = Math.ceil(
      await repository.count({
        where,
      }),
    );

    return {
      ok: true,
      hasNext: input.skip + input.take < total,
    };
  }
}
