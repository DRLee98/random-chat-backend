import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/common/common.service';

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
      const { id } = user;
      return {
        ok: true,
        token: this.jwtService.sign({ id }),
      };
    }
    return this.commonService.error('존재하지 않는 계정입니다.');
  }

  decodeToken(token: string): String | null {
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
