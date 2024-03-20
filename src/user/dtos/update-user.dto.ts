import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { User } from '../entites/user.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { Upload } from 'graphql-upload';

@InputType()
export class UpdateUserInput extends PartialType(
  PickType(User, [
    'fcmToken',
    'nickname',
    'bio',
    'allowMessage',
    'language',
    'autoTranslation',
  ]),
) {
  @Field(() => GraphQLUpload, { nullable: true })
  profile?: Upload['promise'];
}

@ObjectType()
export class UpdateUserOutput extends CoreOutput {}
