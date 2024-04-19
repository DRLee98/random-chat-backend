import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';

import { FcmModule } from 'src/fcm/fcm.module';

import { Notification } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), FcmModule],
  providers: [NotificationResolver, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
