import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';

import { NotificationService } from './notification.service';

import { Notification } from './entities/notification.entity';
import { User } from 'src/user/entities/user.entity';
import { LoggedInUser } from 'src/user/user.decorator';

import {
  ViewNotificationsInput,
  ViewNotificationsOutput,
} from './dtos/view-notifications.dto';
import { UnReadNotificationCountOutput } from './dtos/un-read-notification-count';
import {
  CreateNotificationInput,
  CreateNotificationOutput,
} from './dtos/create-notification.dto';
import {
  ReadNotificationInput,
  ReadNotificationOutput,
} from './dtos/read-notification.dto';
import { ReadAllNotificationsOutput } from './dtos/read-all-notifications.dto';
import {
  DeleteNotificationInput,
  DeleteNotificationOutput,
} from './dtos/delete-notification.dto';
import { DeleteReadNotificationsOutput } from './dtos/delete-read-notifications.dto';

import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { NEW_NOTIFICATION } from './notification.constants';

@Resolver()
export class NotificationResolver {
  constructor(
    private readonly notificationService: NotificationService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => ViewNotificationsOutput)
  async viewNotifications(
    @Args('input') input: ViewNotificationsInput,
    @LoggedInUser() user: User,
  ): Promise<ViewNotificationsOutput> {
    return this.notificationService.viewNotifications(input, user);
  }
  @Query(() => UnReadNotificationCountOutput)
  async unReadNotificationCount(
    @LoggedInUser() user: User,
  ): Promise<UnReadNotificationCountOutput> {
    return this.notificationService.unReadNotificationCount(user);
  }

  @Mutation(() => CreateNotificationOutput)
  async createNotification(
    @Args('input') input: CreateNotificationInput,
    @LoggedInUser() user: User,
  ): Promise<CreateNotificationOutput> {
    return this.notificationService.createNotification(input, user);
  }

  @Mutation(() => ReadNotificationOutput)
  async readNotification(
    @Args('input') input: ReadNotificationInput,
    @LoggedInUser() user: User,
  ): Promise<ReadNotificationOutput> {
    return this.notificationService.readNotification(input, user);
  }

  @Mutation(() => ReadAllNotificationsOutput)
  async readAllNotifications(
    @LoggedInUser() user: User,
  ): Promise<ReadAllNotificationsOutput> {
    return this.notificationService.readAllNotifications(user);
  }

  @Mutation(() => DeleteNotificationOutput)
  async deleteNotification(
    @Args('input') input: DeleteNotificationInput,
    @LoggedInUser() user: User,
  ): Promise<DeleteNotificationOutput> {
    return this.notificationService.deleteNotification(input, user);
  }

  @Mutation(() => DeleteReadNotificationsOutput)
  async deleteReadNotifications(
    @LoggedInUser() user: User,
  ): Promise<DeleteReadNotificationsOutput> {
    return this.notificationService.deleteReadNotifications(user);
  }

  @Subscription(() => Notification, {
    filter: (payload, _, context) => {
      return payload.newNotification.user.id === context.user.id;
    },
    resolve(payload) {
      return payload.newNotification;
    },
  })
  newNotification() {
    return this.pubSub.asyncIterator(NEW_NOTIFICATION);
  }
}
