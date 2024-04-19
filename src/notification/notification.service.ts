import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommonService } from 'src/common/common.service';
import { FcmService } from 'src/fcm/fcm.service';

import { Notification } from './entities/notification.entity';
import { User } from 'src/user/entities/user.entity';

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

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly fcmService: FcmService,
    private readonly commonService: CommonService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  viewNotifications = async (
    input: ViewNotificationsInput,
    user: User,
  ): Promise<ViewNotificationsOutput> => {
    try {
      const notifications = await this.notificationRepository.find({
        where: {
          user: {
            id: user.id,
          },
        },
        order: {
          read: 'ASC',
          createdAt: 'DESC',
        },
        ...this.commonService.paginationOption(input),
      });

      const output = await this.commonService.paginationOutput(
        input,
        this.notificationRepository,
        {
          user: {
            id: user.id,
          },
        },
      );

      return {
        notifications,
        ...output,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  };

  unReadNotificationCount = async (
    user: User,
  ): Promise<UnReadNotificationCountOutput> => {
    try {
      const count = await this.notificationRepository.count({
        where: {
          read: false,
          user: {
            id: user.id,
          },
        },
      });

      return {
        ok: true,
        count,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  };

  createNotification = async (
    input: CreateNotificationInput,
    user: User,
  ): Promise<CreateNotificationOutput> => {
    try {
      const notification = this.notificationRepository.create({
        ...input,
        user,
      });

      await this.notificationRepository.save(notification);

      if (user.fcmToken) {
        this.fcmService.pushMessage({
          token: user.fcmToken,
          title: input.title,
          message: input.message,
          imageUrl: input.imageUrl,
          data: input.data,
        });
      }

      this.pubSub.publish(NEW_NOTIFICATION, {
        newNotification: notification,
      });

      return {
        ok: true,
        notification,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  };

  readNotification = async (
    input: ReadNotificationInput,
    user: User,
  ): Promise<ReadNotificationOutput> => {
    try {
      const notification = await this.notificationRepository.findOne({
        where: {
          id: input.id,
          user: {
            id: user.id,
          },
        },
      });

      if (!notification)
        return this.commonService.error('알림을 찾을 수 없습니다.');

      await this.notificationRepository.update(notification.id, { read: true });

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  };

  readAllNotifications = async (
    user: User,
  ): Promise<ReadAllNotificationsOutput> => {
    try {
      const notifications = await this.notificationRepository.find({
        where: {
          user: {
            id: user.id,
          },
          read: false,
        },
      });

      const notificationIds = notifications.map(
        (notification) => notification.id,
      );

      if (notificationIds.length > 0)
        await this.notificationRepository.update(notificationIds, {
          read: true,
        });

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  };

  deleteNotification = async (
    input: DeleteNotificationInput,
    user: User,
  ): Promise<DeleteNotificationOutput> => {
    try {
      const notification = await this.notificationRepository.findOne({
        where: {
          id: input.id,
          user: {
            id: user.id,
          },
        },
      });

      if (!notification)
        return this.commonService.error('알림을 찾을 수 없습니다.');

      await this.notificationRepository.softDelete(notification.id);

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  };

  deleteReadNotifications = async (
    user: User,
  ): Promise<DeleteReadNotificationsOutput> => {
    try {
      const notifications = await this.notificationRepository.find({
        where: {
          user: {
            id: user.id,
          },
          read: true,
        },
      });

      const notificationIds = notifications.map(
        (notification) => notification.id,
      );

      if (notificationIds.length > 0)
        await this.notificationRepository.softDelete(notificationIds);

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  };
}
