import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Message } from '../entities/message.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class ViewMessagesInput extends PaginationInput {
  @Field(() => ID)
  roomId: string;
}

@ObjectType()
export class ViewMessagesOutput extends PaginationOutput {
  @Field(() => [Message], { nullable: true })
  messages?: Message[];
}
