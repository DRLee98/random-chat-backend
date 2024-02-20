import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/entites/user.entity';
import { AuthModule } from './auth/auth.module';
import { MessageModule } from './message/message.module';
import { RoomModule } from './room/room.module';
import { Room } from './room/entites/room.entity';
import { UserRoom } from './room/entites/user-room.entity';
import { Message } from './message/entites/message.entity';
import { CommonModule } from './common/common.module';
import { AwsModule } from './aws/aws.module';

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
      entities: [User, Room, UserRoom, Message],
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
    UserModule,
    AuthModule,
    RoomModule,
    MessageModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
