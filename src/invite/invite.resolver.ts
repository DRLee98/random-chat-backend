import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';

import { InviteService } from './invite.service';

import { User } from 'src/user/entities/user.entity';
import { LoggedInUser } from 'src/user/user.decorator';

import {
  InviteTargetsInput,
  InviteTargetsOutput,
} from './dtos/invite-target.dto';
import {
  CreateInviteInput,
  CreateInviteOutput,
} from './dtos/create-invite.dto';
import {
  UpdateInviteInput,
  UpdateInviteOutput,
} from './dtos/update-invite.dto';
import { MyInvitesOutput } from './dtos/my-invites.dto';

import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from 'src/common/common.constants';
import { UPDATE_INVITE_STATUS } from './invite.constants';
import { UpdateInviteStatus } from './dtos/update-invite-status';

@Resolver()
export class InviteResolver {
  constructor(
    private readonly inviteService: InviteService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => InviteTargetsOutput)
  async inviteTargets(
    @Args('input') input: InviteTargetsInput,
    @LoggedInUser() user: User,
  ): Promise<InviteTargetsOutput> {
    return this.inviteService.inviteTargets(input, user);
  }

  @Query(() => MyInvitesOutput)
  async myInvites(@LoggedInUser() user: User): Promise<MyInvitesOutput> {
    return this.inviteService.myInvites(user);
  }

  @Mutation(() => CreateInviteOutput)
  async createInvite(
    @Args('input') input: CreateInviteInput,
    @LoggedInUser() user: User,
  ): Promise<CreateInviteOutput> {
    return this.inviteService.createInvite(input, user);
  }

  @Mutation(() => UpdateInviteOutput)
  async updateInvite(
    @Args('input') input: UpdateInviteInput,
    @LoggedInUser() user: User,
  ): Promise<UpdateInviteOutput> {
    return this.inviteService.updateInvite(input, user);
  }

  @Subscription(() => UpdateInviteStatus, {
    filter(payload, _, context) {
      return payload.updateInviteStatus.userId === context.user.id;
    },
    resolve(payload) {
      return payload.updateInviteStatus;
    },
  })
  updateInviteStatus() {
    return this.pubSub.asyncIterator(UPDATE_INVITE_STATUS);
  }
}
