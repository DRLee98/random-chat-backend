import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entites/user.entity';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { UpdateUserInput, UpdateUserOutput } from './dtos/update-user.dto';

@Resolver()
export class UserResolver {
  //   constructor(private userService: UserService) {}

  @Query(() => User)
  me() {
    return;
  }

  @Mutation(() => CreateUserOutput)
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<CreateUserOutput> {
    console.log(input);
    return;
  }

  @Mutation(() => UpdateUserOutput)
  async updateUser(
    @Args('input') input: UpdateUserInput,
  ): Promise<UpdateUserOutput> {
    console.log(input);
    return;
  }
}
