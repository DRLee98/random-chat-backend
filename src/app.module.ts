import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MessageModule } from './message/message.module';
import { RoomModule } from './room/room.module';
import { CommonModule } from './common/common.module';
import { AwsModule } from './aws/aws.module';
import { FcmModule } from './fcm/fcm.module';
import { NoticeModule } from './notice/notice.module';
import { NotificationModule } from './notification/notification.module';
import { OpinionModule } from './opinion/opinion.module';
import { CommentModule } from './comment/comment.module';
import { ReplyModule } from './reply/reply.module';
import { InviteModule } from './invite/invite.module';
import { AccusationModule } from './accusation/accusation.module';

import { User } from './user/entities/user.entity';
import { Room } from './room/entities/room.entity';
import { UserRoom } from './room/entities/user-room.entity';
import { Message } from './message/entities/message.entity';
import { Notice } from './notice/entities/notice.entity';
import { Notification } from './notification/entities/notification.entity';
import { Opinion } from './opinion/entities/opinion.entity';
import { Comment } from './comment/entities/comment.entity';
import { Reply } from './reply/entities/reply.entity';
import { Invite } from './invite/entities/invite.entity';
import { AccusationInfo } from './accusation/entities/accusation-info.entity';
import { Accusation } from './accusation/entities/accusation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      // ignoreEnvFile: process.env.NODE_ENV === 'prod',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true,
      logging: true,
      entities: [
        User,
        Room,
        Invite,
        UserRoom,
        Message,
        Notice,
        Notification,
        Opinion,
        Comment,
        Reply,
        AccusationInfo,
        Accusation,
      ],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: process.env.NODE_ENV !== 'prod',
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: (connectionParams: any) => connectionParams,
        },
      },
    }),
    ScheduleModule.forRoot(),
    AwsModule,
    FcmModule,
    NoticeModule,
    NotificationModule,
    ReplyModule,
    CommentModule,
    OpinionModule,
    UserModule,
    AuthModule,
    RoomModule,
    MessageModule,
    CommonModule,
    InviteModule,
    AccusationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
