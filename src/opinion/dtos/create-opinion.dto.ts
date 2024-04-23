import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Opinion } from '../entities/opinion.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { Upload } from 'graphql-upload';

@InputType()
export class CreateOpinionInput extends PickType(Opinion, [
  'title',
  'content',
  'category',
]) {
  @Field(() => [GraphQLUpload], { nullable: true })
  images?: Array<Upload['promise']>;
}

@ObjectType()
export class CreateOpinionOutput extends CoreOutput {
  @Field(() => Opinion, { nullable: true })
  opinion?: Opinion;
}
