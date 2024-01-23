import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { PUB_SUB } from './common.constants';
import { PubSub } from 'graphql-subscriptions';

@Global()
@Module({
  providers: [
    CommonService,
    {
      provide: PUB_SUB,
      useValue: new PubSub(),
    },
  ],
  exports: [CommonService, PUB_SUB],
})
export class CommonModule {}
