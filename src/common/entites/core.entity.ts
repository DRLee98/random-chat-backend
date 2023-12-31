import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CoreEntity {
  @Field(() => ID)
  id: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
