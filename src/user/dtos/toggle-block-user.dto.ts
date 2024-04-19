import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class ToggleBlockUserInput extends PickType(User, ['id']) {}

@ObjectType()
export class ToggleBlockUserOutput extends CoreOutput {
  @Field(() => [User], { nullable: true })
  updateBlockUsers?: User[];
}
