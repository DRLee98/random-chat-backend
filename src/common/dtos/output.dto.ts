import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CoreOutPut {
  @Field(() => Boolean)
  ok: Boolean;

  @Field(() => String, { nullable: true })
  error?: String;
}
