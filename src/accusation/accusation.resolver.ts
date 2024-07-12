import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';

import { AccusationService } from './accusation.service';

import { User } from 'src/user/entities/user.entity';
import { LoggedInUser } from 'src/user/user.decorator';

import { MyAccusationInfoOutput } from './dtos/my-accusation-info.dto';
import {
  ViewAccusationsInput,
  ViewAccusationsOutput,
} from './dtos/view-accusations.dto';
import {
  ViewAccusationInput,
  ViewAccusationOutput,
} from './dtos/view-accusation.dto';
import {
  CreateAccusationInput,
  CreateAccusationOutput,
} from './dtos/create-accusation.dto';
import {
  UpdateAccusationStatusInput,
  UpdateAccusationStatusOutput,
} from './dtos/update-accusation-status.dto';

@Resolver()
export class AccusationResolver {
  constructor(private readonly accusationService: AccusationService) {}

  @Query(() => MyAccusationInfoOutput)
  async myAccusationInfo(
    @LoggedInUser() user: User,
  ): Promise<MyAccusationInfoOutput> {
    return this.accusationService.myAccusationInfo(user);
  }

  @Query(() => ViewAccusationsOutput)
  async viewAccusations(
    @Args('input') input: ViewAccusationsInput,
  ): Promise<ViewAccusationsOutput> {
    return this.accusationService.viewAccusations(input);
  }

  @Query(() => ViewAccusationOutput)
  async viewAccusation(
    @Args('input') input: ViewAccusationInput,
  ): Promise<ViewAccusationOutput> {
    return this.accusationService.viewAccusation(input);
  }

  @Mutation(() => CreateAccusationOutput)
  async createAccusation(
    @Args('input') input: CreateAccusationInput,
    @LoggedInUser() user: User,
  ): Promise<CreateAccusationOutput> {
    return this.accusationService.createAccusation(input, user);
  }

  @Mutation(() => UpdateAccusationStatusOutput)
  async updateAccusationStatus(
    @Args('input') input: UpdateAccusationStatusInput,
  ): Promise<UpdateAccusationStatusOutput> {
    return this.accusationService.updateAccusationStatus(input);
  }
}
