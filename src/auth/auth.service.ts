import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login({ socialId, socialPlatform }: LoginInput): Promise<LoginOutput> {
    const user = await this.userService.findUserBySocialId(
      socialId,
      socialPlatform,
    );
    if (user) {
      const { id, nickname } = user;
      return {
        ok: true,
        token: await this.jwtService.signAsync({ id, nickname }),
      };
    }
    return {
      ok: false,
      error: '존재하지 않는 계정입니다.',
    };
  }
}
