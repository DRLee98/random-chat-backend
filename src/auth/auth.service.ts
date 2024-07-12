import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserService } from 'src/user/user.service';
import { CommonService } from 'src/common/common.service';

import { LoginInput, LoginOutput } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly commonService: CommonService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ socialId, socialPlatform }: LoginInput): Promise<LoginOutput> {
    const user = await this.userService.findUserBySocialId(
      socialId,
      socialPlatform,
    );
    if (user) {
      const { id, suspensionEndAt } = user;
      if (suspensionEndAt && suspensionEndAt > new Date()) {
        return {
          ok: false,
          error: '정지된 계정입니다.',
          suspended: true,
        };
      }
      return {
        ok: true,
        token: this.jwtService.sign({ id }),
      };
    }
    return this.commonService.error('존재하지 않는 계정입니다.');
  }

  decodeToken(token: string): string | null {
    try {
      const decode = this.jwtService.verify(token.split(' ')[1]);
      if (typeof decode === 'object' && decode.id) {
        return decode.id;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
