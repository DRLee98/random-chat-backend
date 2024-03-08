import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Message } from '../entites/message.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class SendMessageInput extends PickType(Message, ['contents', 'type']) {
  @Field(() => Number)
  roomId: number;
}

@ObjectType()
export class SendMessageOutput extends CoreOutput {
  @Field(() => Message, { nullable: true })
  message?: Message;
}
