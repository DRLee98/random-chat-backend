import { Test } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { CommonService } from 'src/common/common.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { LoginInput } from '../dtos/login.dto';
import { MockService } from 'test/utils';
import { SocialPlatform } from 'src/user/entities/user.entity';

const token = 'Bearer token';

const userData = {
  id: 'test',
};

const mockUserService = () => ({
  findUserBySocialId: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
});

describe('AuthService 테스트', () => {
  let authService: AuthService;
  let userService: MockService<UserService>;
  let jwtService: MockService<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        CommonService,
        {
          provide: UserService,
          useValue: mockUserService(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  it('서비스 health check ', () => {
    expect(authService).toBeDefined();
    expect(userService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('로그인 테스트', () => {
    const input: LoginInput = {
      socialId: 'test',
      socialPlatform: SocialPlatform.NAVER,
    };

    it('존재하는 유저 테스트', async () => {
      userService.findUserBySocialId.mockResolvedValue(null);

      const result = await authService.login(input);

      expect(result.ok).toEqual(false);
      expect(result.token).toEqual(undefined);
      expect(typeof result.error).toBe('string');

      expect(userService.findUserBySocialId).toHaveBeenCalledTimes(1);
      expect(userService.findUserBySocialId).toHaveBeenCalledWith(
        input.socialId,
        input.socialPlatform,
      );

      expect(jwtService.sign).toHaveBeenCalledTimes(0);
    });

    it('로그인 토큰 발급', async () => {
      userService.findUserBySocialId.mockResolvedValue(userData);
      jwtService.sign.mockReturnValue(token);

      const result = await authService.login(input);

      expect(result.ok).toEqual(true);
      expect(result.token).toEqual(token);
      expect(result.error).toEqual(undefined);

      expect(userService.findUserBySocialId).toHaveBeenCalledTimes(1);
      expect(userService.findUserBySocialId).toHaveBeenCalledWith(
        input.socialId,
        input.socialPlatform,
      );

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: userData.id });
    });
  });

  describe('토큰 검증 테스트', () => {
    it('유효하지 않은 토큰인 경우', () => {
      jwtService.verify.mockReturnValue(null);

      const result = authService.decodeToken(token);

      expect(result).toEqual(null);

      expect(jwtService.verify).toHaveBeenCalledTimes(1);
      expect(jwtService.verify).toHaveBeenCalledWith(token.split(' ')[1]);
    });

    it('토큰 검증', () => {
      jwtService.verify.mockReturnValue(userData);

      const result = authService.decodeToken(token);

      expect(result).toEqual(userData.id);

      expect(jwtService.verify).toHaveBeenCalledTimes(1);
      expect(jwtService.verify).toHaveBeenCalledWith(token.split(' ')[1]);
    });
  });
});
