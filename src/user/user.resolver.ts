import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entites/user.entity';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { UpdateUserInput, UpdateUserOutput } from './dtos/update-user.dto';
import { LoggedInUser } from './user.decorator';
import { Private } from 'src/auth/auth.decorator';
import { MeOutput } from './dtos/me.dto';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => MeOutput)
  @Private()
  me(@LoggedInUser() user?: User): MeOutput {
    return this.userService.me(user);
  }

  @Mutation(() => CreateUserOutput)
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<CreateUserOutput> {
    return this.userService.createUser(input);
  }

  @Mutation(() => UpdateUserOutput)
  @Private()
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @LoggedInUser() user?: User,
  ): Promise<UpdateUserOutput> {
    return this.userService.updateUser(input, user);
  }
}
