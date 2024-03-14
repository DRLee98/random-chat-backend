import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { MockService } from 'test/utils';
import { userFactory } from '../user.decorator';

const mockContenxt = () => ({
  getHandler: jest.fn(),
});

describe('UserDecorator 테스트', () => {
  let context: MockService<ExecutionContext>;
  let spyOnGqlContextCreate: jest.SpyInstance;

  beforeEach(() => {
    context = mockContenxt();
    spyOnGqlContextCreate = jest.spyOn(GqlExecutionContext, 'create');
  });

  it('유저 데이터 없음', async () => {
    spyOnGqlContextCreate.mockReturnValue({
      getContext: () => ({}),
    });

    await expect(
      async () => await userFactory('id', context as ExecutionContext),
    ).rejects.toThrow(Error('로그인 후 이용해주세요.'));
  });

  it('유저 데이터 없음', async () => {
    spyOnGqlContextCreate.mockReturnValue({
      getContext: () => ({
        user: {
          id: 'xxx',
        },
      }),
    });

    const result = await userFactory('id', context as ExecutionContext);

    expect(result).toEqual('xxx');
  });
});
