import { Test } from '@nestjs/testing';
import { AuthGuard } from '../auth.guard';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { UserService } from 'src/user/user.service';
import { MockService } from 'test/utils';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

const token = 'Bearer token';

const mockReflector = () => ({
  get: jest.fn(),
});

const mockAuthService = () => ({
  decodeToken: jest.fn(),
});

const mockUserService = () => ({
  findUserById: jest.fn(),
});

const mockContenxt = () => ({
  getHandler: jest.fn(),
});

describe('AuthGuard 테스트', () => {
  let authGuard: AuthGuard;
  let reflector: MockService<Reflector>;
  let authService: MockService<AuthService>;
  let userService: MockService<UserService>;

  let context: MockService<ExecutionContext>;
  let spyOnGqlContextCreate: jest.SpyInstance;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector(),
        },
        {
          provide: AuthService,
          useValue: mockAuthService(),
        },
        {
          provide: UserService,
          useValue: mockUserService(),
        },
      ],
    }).compile();

    authGuard = module.get(AuthGuard);
    reflector = module.get(Reflector);
    authService = module.get(AuthService);
    userService = module.get(UserService);

    context = mockContenxt();
    spyOnGqlContextCreate = jest.spyOn(GqlExecutionContext, 'create');
  });

  it('서비스 health check ', () => {
    expect(authGuard).toBeDefined();
    expect(reflector).toBeDefined();
    expect(authService).toBeDefined();
    expect(userService).toBeDefined();
  });

  it('public 요청 테스트', async () => {
    reflector.get.mockReturnValue('public');

    const result = await authGuard.canActivate(context as ExecutionContext);

    expect(result).toEqual(true);

    expect(reflector.get).toHaveBeenCalledTimes(1);

    expect(authService.decodeToken).toHaveBeenCalledTimes(0);
    expect(userService.findUserById).toHaveBeenCalledTimes(0);
  });

  describe('private 요청 테스트', () => {
    it('토큰 없음', async () => {
      reflector.get.mockReturnValue(null);
      spyOnGqlContextCreate.mockReturnValue({
        getContext: () => ({}),
      });

      await expect(
        async () => await authGuard.canActivate(context as ExecutionContext),
      ).rejects.toThrow(new UnauthorizedException());

      expect(reflector.get).toHaveBeenCalledTimes(1);

      expect(authService.decodeToken).toHaveBeenCalledTimes(0);
      expect(userService.findUserById).toHaveBeenCalledTimes(0);
    });

    it('토큰 검증 값 없음', async () => {
      reflector.get.mockReturnValue(null);
      authService.decodeToken.mockReturnValue(null);
      spyOnGqlContextCreate.mockReturnValue({
        getContext: () => ({
          req: {
            headers: {
              authorization: token,
            },
          },
        }),
      });

      await expect(
        async () => await authGuard.canActivate(context as ExecutionContext),
      ).rejects.toThrow(new UnauthorizedException());

      expect(reflector.get).toHaveBeenCalledTimes(1);

      expect(authService.decodeToken).toHaveBeenCalledTimes(1);
      expect(authService.decodeToken).toHaveBeenCalledWith(token);

      expect(userService.findUserById).toHaveBeenCalledTimes(0);
    });

    it('토큰 값과 일치하는 유저 없음', async () => {
      reflector.get.mockReturnValue(null);
      authService.decodeToken.mockReturnValue('test');
      userService.findUserById.mockResolvedValue(null);
      spyOnGqlContextCreate.mockReturnValue({
        getContext: () => ({
          req: {
            headers: {
              authorization: token,
            },
          },
        }),
      });

      await expect(
        async () => await authGuard.canActivate(context as ExecutionContext),
      ).rejects.toThrow(new UnauthorizedException());

      expect(reflector.get).toHaveBeenCalledTimes(1);

      expect(authService.decodeToken).toHaveBeenCalledTimes(1);
      expect(authService.decodeToken).toHaveBeenCalledWith(token);

      expect(userService.findUserById).toHaveBeenCalledTimes(1);
      expect(userService.findUserById).toHaveBeenCalledWith('test');
    });

    it('토큰 인증 성공', async () => {
      reflector.get.mockReturnValue(null);
      authService.decodeToken.mockReturnValue('test');
      userService.findUserById.mockResolvedValue({ id: 'test' });
      spyOnGqlContextCreate.mockReturnValue({
        getContext: () => ({
          req: {
            headers: {
              authorization: token,
            },
          },
        }),
      });

      const result = await authGuard.canActivate(context as ExecutionContext);

      expect(result).toEqual(true);

      expect(reflector.get).toHaveBeenCalledTimes(1);

      expect(authService.decodeToken).toHaveBeenCalledTimes(1);
      expect(authService.decodeToken).toHaveBeenCalledWith(token);

      expect(userService.findUserById).toHaveBeenCalledTimes(1);
      expect(userService.findUserById).toHaveBeenCalledWith('test');
    });
  });
});
