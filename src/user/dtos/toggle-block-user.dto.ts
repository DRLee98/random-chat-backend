import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entites/user.entity';
import { CoreOutPut } from 'src/common/dtos/output.dto';

@InputType()
export class ToggleBlockUserInput extends PickType(User, ['id']) {}

@ObjectType()
export class ToggleBlockUserOutput extends CoreOutPut {
  @Field(() => [User], { nullable: true })
  updateBlockUsers?: User[];
}
