import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Message } from '../entites/message.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class ViewMessagesInput extends PaginationInput {
  @Field(() => Number)
  roomId: number;
}

@ObjectType()
export class ViewMessagesOutput extends PaginationOutput {
  @Field(() => [Message], { nullable: true })
  messages?: Message[];
}
