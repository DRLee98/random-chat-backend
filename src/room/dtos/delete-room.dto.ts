import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteRoomInput {
  @Field(() => Number)
  roomId: number;
}

@ObjectType()
export class DeleteRoomOutput extends CoreOutput {}
