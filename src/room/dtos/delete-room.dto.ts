import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteRoomInput {
  @Field(() => ID)
  roomId: string;
}

@ObjectType()
export class DeleteRoomOutput extends CoreOutput {}
