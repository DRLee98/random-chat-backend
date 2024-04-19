import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

import { AwsModule } from 'src/aws/aws.module';

import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AwsModule],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}
