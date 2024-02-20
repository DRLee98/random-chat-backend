import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entites/user.entity';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';

@InputType()
export class CreateUserInput extends PickType(User, [
  'socialId',
  'socialPlatform',
]) {
  @Field(() => String)
  nickname: string;

  @Field(() => String, { nullable: true })
  bio?: string;

  @Field(() => GraphQLUpload, { nullable: true })
  profile?: Upload;
}

@ObjectType()
export class CreateUserOutput extends CoreOutput {
  @Field(() => User, { nullable: true })
  user?: User;
}
