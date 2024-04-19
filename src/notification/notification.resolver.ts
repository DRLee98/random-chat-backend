import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { NotificationService } from './notification.service';

import { User } from 'src/user/entities/user.entity';
import { LoggedInUser } from 'src/user/user.decorator';

import {
  ViewNotificationsInput,
  ViewNotificationsOutput,
} from './dtos/view-notifications.dto';
import {
  CreateNotificationInput,
  CreateNotificationOutput,
} from './dtos/create-notification.dto';
import {
  ReadNotificationInput,
  ReadNotificationOutput,
} from './dtos/read-notification.dto';
import {
  DeleteNotificationInput,
  DeleteNotificationOutput,
} from './dtos/delete-notification.dto';

@Resolver()
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => ViewNotificationsOutput)
  async viewNotifications(
    @Args('input') input: ViewNotificationsInput,
    @LoggedInUser() user: User,
  ): Promise<ViewNotificationsOutput> {
    return this.notificationService.viewNotifications(input, user);
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

  @Mutation(() => DeleteNotificationOutput)
  async deleteNotification(
    @Args('input') input: DeleteNotificationInput,
    @LoggedInUser() user: User,
  ): Promise<DeleteNotificationOutput> {
    return this.notificationService.deleteNotification(input, user);
  }
}
