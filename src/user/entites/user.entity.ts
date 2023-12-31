import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entites/core.entity';

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
export class User extends CoreEntity {
  @Field(() => String)
  socialId: String;

  @Field(() => String)
  socialPlatform: String;

  @Field(() => String)
  nickname: String;

  @Field(() => String, { nullable: true })
  bio?: String;

  @Field(() => String, { nullable: true })
  profileUrl?: String;

  @Field(() => Boolean)
  allowMessage: Boolean;

  @Field(() => [User])
  blockUsers: User[];
}
