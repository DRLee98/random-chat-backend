import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entites/user.entity';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { UpdateUserInput, UpdateUserOutput } from './dtos/update-user.dto';
import { LoggedInUser } from './user.decorator';
import { MeOutput } from './dtos/me.dto';
import { DeleteUserOutput } from './dtos/delete-user.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import {
  ToggleBlockUserInput,
  ToggleBlockUserOutput,
} from './dtos/toggle-block-user.dto';
import { Public } from 'src/auth/auth.decorator';
import { RandomNicknameOutput } from './dtos/random-nickname.dto';
import { MeDetailOutput } from './dtos/me-detail.dto';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => MeOutput)
  me(@LoggedInUser() user: User): MeOutput {
    return this.userService.me(user);
  }

  @Query(() => MeDetailOutput)
  meDetail(@LoggedInUser() user: User): Promise<MeDetailOutput> {
    return this.userService.meDetail(user);
  }

  @Query(() => UserProfileOutput)
  userProfile(
    @Args('input') input: UserProfileInput,
  ): Promise<UserProfileOutput> {
    return this.userService.userProfile(input);
  }

  @Mutation(() => CreateUserOutput)
  @Public()
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<CreateUserOutput> {
    return this.userService.createUser(input);
  }

  @Mutation(() => UpdateUserOutput)
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @LoggedInUser() user: User,
  ): Promise<UpdateUserOutput> {
    return this.userService.updateUser(input, user);
  }

  @Mutation(() => DeleteUserOutput)
  async deleteUser(@LoggedInUser() user: User): Promise<DeleteUserOutput> {
    return this.userService.deleteUser(user);
  }

  @Mutation(() => ToggleBlockUserOutput)
  async toggleBlockUser(
    @Args('input') input: ToggleBlockUserInput,
    @LoggedInUser() user: User,
  ): Promise<ToggleBlockUserOutput> {
    return this.userService.toggleBlockUser(input, user);
  }

  @Query(() => RandomNicknameOutput)
  @Public()
  randomNickname(): Promise<RandomNicknameOutput> {
    return this.userService.randomNickname();
  }

  // 데이터 추가용
  @Mutation(() => Boolean)
  async createManyUser(@Args('number') number: number) {
    return this.userService.createManyUser(number);
  }
}
