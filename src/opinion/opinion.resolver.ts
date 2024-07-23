import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { OpinionService } from './opinion.service';

import { LoggedInUser } from 'src/user/user.decorator';
import { User } from 'src/user/entities/user.entity';

import { MyOpinionsInput, MyOpinionsOutput } from './dtos/my-opinions.dto';
import {
  ViewOpinionsInput,
  ViewOpinionsOutput,
} from './dtos/view-opinions.dto';
import {
  OpinionDetailInput,
  OpinionDetailOutput,
} from './dtos/opinion-detail.dto';
import {
  CreateOpinionInput,
  CreateOpinionOutput,
} from './dtos/create-opinion.dto';
import { EditOpinionInput, EditOpinionOutput } from './dtos/edit-opinion.dto';
import {
  DeleteOpinionInput,
  DeleteOpinionOutput,
} from './dtos/delete-opinion.dto';
import {
  UpdateOpinionStatusInput,
  UpdateOpinionStatusOutput,
} from './dtos/update-opinion-status';

import { Public } from 'src/auth/auth.decorator';

@Resolver()
export class OpinionResolver {
  constructor(private readonly opinionService: OpinionService) {}

  @Query(() => MyOpinionsOutput)
  myOpinions(
    @Args('input') input: MyOpinionsInput,
    @LoggedInUser() user: User,
  ): Promise<MyOpinionsOutput> {
    return this.opinionService.myOpinions(input, user);
  }

  @Query(() => ViewOpinionsOutput)
  viewOpinions(
    @Args('input') input: ViewOpinionsInput,
  ): Promise<ViewOpinionsOutput> {
    return this.opinionService.viewOpinions(input);
  }

  @Query(() => OpinionDetailOutput)
  opinionDetail(
    @Args('input') input: OpinionDetailInput,
    @LoggedInUser() user: User,
  ): Promise<OpinionDetailOutput> {
    return this.opinionService.opinionDetail(input, user);
  }

  @Mutation(() => CreateOpinionOutput)
  createOpinion(
    @Args('input') input: CreateOpinionInput,
    @LoggedInUser() user: User,
  ): Promise<CreateOpinionOutput> {
    return this.opinionService.createOpinion(input, user);
  }

  @Mutation(() => EditOpinionOutput)
  editOpinion(
    @Args('input') input: EditOpinionInput,
    @LoggedInUser() user: User,
  ): Promise<EditOpinionOutput> {
    return this.opinionService.editOpinion(input, user);
  }

  @Mutation(() => DeleteOpinionOutput)
  deleteOpinion(
    @Args('input') input: DeleteOpinionInput,
    @LoggedInUser() user: User,
  ): Promise<DeleteOpinionOutput> {
    return this.opinionService.deleteOpinion(input, user);
  }

  @Public()
  @Mutation(() => UpdateOpinionStatusOutput)
  updateOpinionStatus(
    @Args('input') input: UpdateOpinionStatusInput,
  ): Promise<UpdateOpinionStatusOutput> {
    return this.opinionService.updateOpinionStatus(input);
  }
}
