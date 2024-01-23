import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Public } from './auth.decorator';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';

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
          const user = await this.userService.findUserById(+decodeId);
          if (user) gqlContext.user = user;
        }
      }

      return Boolean(gqlContext.user);
    }

    return true;
  }
}
