import { Query, Args, Resolver } from '@nestjs/graphql';

import { AuthService } from './auth.service';

import { LoginInput, LoginOutput } from './dtos/login.dto';
import {
  PasswordCheckInput,
  PasswordCheckOutput,
} from './dtos/password-check.dto';

import { Public } from './auth.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => LoginOutput)
  @Public()
  async login(@Args('input') input: LoginInput): Promise<LoginOutput> {
    return this.authService.login(input);
  }

  @Query(() => PasswordCheckOutput)
  @Public()
  async passwordCheck(
    @Args('input') input: PasswordCheckInput,
  ): Promise<PasswordCheckOutput> {
    return this.authService.passwordCheck(input);
  }
}
