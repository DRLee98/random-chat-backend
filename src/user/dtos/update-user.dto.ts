import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { User } from '../entites/user.entity';
import { CoreOutPut } from 'src/common/dtos/output.dto';

@InputType()
export class UpdateUserInput extends PartialType(
  PickType(User, [
    'nickname',
    'bio',
    'profileUrl',
    'allowMessage',
    'language',
    'autoTranslation',
  ]),
) {}

@ObjectType()
export class UpdateUserOutput extends CoreOutPut {}
