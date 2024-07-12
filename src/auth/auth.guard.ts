import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';

import { Public } from './auth.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = Boolean(this.reflector.get(Public, context.getHandler()));

    if (!isPublic) {
      const gqlContext = GqlExecutionContext.create(context).getContext();
      const token =
        gqlContext?.req?.headers['authorization'] ??
        gqlContext['authorization'];
      if (token) {
        const decodeId = this.authService.decodeToken(token);
        if (decodeId) {
          const user = await this.userService.findUserById(decodeId);
          if (user) {
            if (user.suspensionEndAt && user.suspensionEndAt > new Date()) {
              throw new HttpException('Suspended', HttpStatus.FORBIDDEN);
            } else {
              gqlContext.user = user;
            }
          }
        }
      }

      if (!Boolean(gqlContext.user)) throw new UnauthorizedException();
    }

    return true;
  }
}
