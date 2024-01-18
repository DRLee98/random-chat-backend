import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ViewMessagesInput,
  ViewMessagesOutput,
} from './dtos/view-messages.dto';
import { MessageService } from './message.service';
import { LoggedInUser } from 'src/user/user.decorator';
import { User } from 'src/user/entites/user.entity';
import { SendMessageInput, SendMessageOutput } from './dtos/send-message.dto';

@Resolver()
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

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
}
