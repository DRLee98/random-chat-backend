import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutPut } from 'src/common/dtos/output.dto';
import { UserRoom } from '../entites/user-room.entity';

@ObjectType()
export class MyRoomsOutput extends CoreOutPut {
  @Field(() => [UserRoom], { nullable: true })
  rooms?: UserRoom[];
}
