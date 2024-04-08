import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import {
  ViewMessagesInput,
  ViewMessagesOutput,
} from './dtos/view-messages.dto';
import { MessageService } from './message.service';
import { LoggedInUser } from 'src/user/user.decorator';
import { User } from 'src/user/entites/user.entity';
import { SendMessageInput, SendMessageOutput } from './dtos/send-message.dto';
import { ReadMessage, ReadMessageInput } from './dtos/read-message.dto';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { NEW_MESSAGE, READ_MESSAGE } from './message.constants';
import { Message } from './entites/message.entity';
import { NewMessageInput } from './dtos/new-message.dto';

@Resolver()
export class MessageResolver {
  constructor(
    private readonly messageService: MessageService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => ViewMessagesOutput)
  viewMessages(
    @Args('input') input: ViewMessagesInput,
    @LoggedInUser() user: User,
  ): Promise<ViewMessagesOutput> {
    return this.messageService.viewMessages(input, user);
  }

  @Mutation(() => SendMessageOutput)
  sendMessage(
    @Args('input') input: SendMessageInput,
    @LoggedInUser() user: User,
  ): Promise<SendMessageOutput> {
    return this.messageService.sendMessage(input, user);
  }

  @Subscription(() => Message, {
    filter: (payload, variables, context) => {
      return (
        payload.newMessage.room.id === variables.input.roomId &&
        payload.newMessage.user.id !== context.user.id
      );
    },
    resolve(payload, variables) {
      this.messageService.readMessage(
        variables.input.roomId,
        payload.newMessage.user.id,
      );
      return payload.newMessage;
    },
  })
  newMessage(@Args('input') _: NewMessageInput) {
    return this.pubSub.asyncIterator(NEW_MESSAGE);
  }

  @Subscription(() => ReadMessage, {
    filter: (payload, variables, context) => {
      return (
        payload.readMessage.roomId === variables.input.roomId &&
        payload.readMessage.userId !== context.user.id
      );
    },
    resolve(payload) {
      return payload.readMessage;
    },
  })
  readMessage(@Args('input') _: ReadMessageInput) {
    return this.pubSub.asyncIterator(READ_MESSAGE);
  }
}
