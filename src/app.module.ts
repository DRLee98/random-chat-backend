import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MessageModule } from './message/message.module';
import { RoomModule } from './room/room.module';
import { CommonModule } from './common/common.module';
import { AwsModule } from './aws/aws.module';
import { FcmModule } from './fcm/fcm.module';
import { NoticeModule } from './notice/notice.module';

import { User } from './user/entities/user.entity';
import { Room } from './room/entities/room.entity';
import { UserRoom } from './room/entities/user-room.entity';
import { Message } from './message/entities/message.entity';
import { Notice } from './notice/entities/notice.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
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
      entities: [User, Room, UserRoom, Message, Notice],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: (connectionParams: any) => connectionParams,
        },
      },
    }),
    AwsModule,
    FcmModule,
    UserModule,
    AuthModule,
    RoomModule,
    MessageModule,
    CommonModule,
    NoticeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
