import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from './entites/user.entity';

export const userFactory = (data: keyof User, ctx: ExecutionContext) => {
  const context = GqlExecutionContext.create(ctx).getContext();
  if (!context.user) throw Error('로그인 후 이용해주세요.');
  return data ? context.user[data] : context.user;
};

export const LoggedInUser = createParamDecorator(userFactory);
