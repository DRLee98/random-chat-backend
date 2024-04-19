import { Field, ID, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Message } from '../entities/message.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class SendMessageInput extends PickType(Message, ['contents', 'type']) {
  @Field(() => ID)
  roomId: string;
}

@ObjectType()
export class SendMessageOutput extends CoreOutput {
  @Field(() => Message, { nullable: true })
  message?: Message;
}
