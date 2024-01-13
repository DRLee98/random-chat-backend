import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entites/user.entity';

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
      const { id } = user;
      return {
        ok: true,
        token: this.jwtService.sign({ id }),
      };
    }
    return {
      ok: false,
      error: '존재하지 않는 계정입니다.',
    };
  }

  async decodeToken(token: string): Promise<User | null> {
    const decode = this.jwtService.verify(token.split(' ')[1]);
    if (typeof decode === 'object' && decode.id) {
      const user = await this.userService.findUserById(decode.id);
      if (user) return user;
    }
    return null;
  }
}
