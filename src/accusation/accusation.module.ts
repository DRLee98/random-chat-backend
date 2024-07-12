import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccusationResolver } from './accusation.resolver';
import { AccusationService } from './accusation.service';

import { AwsModule } from 'src/aws/aws.module';
import { UserModule } from 'src/user/user.module';
import { NotificationModule } from 'src/notification/notification.module';

import { AccusationInfo } from './entities/accusation-info.entity';
import { Accusation } from './entities/accusation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccusationInfo, Accusation]),
    AwsModule,
    UserModule,
    NotificationModule,
  ],
  providers: [AccusationResolver, AccusationService],
  exports: [],
})
export class AccusationModule {}
