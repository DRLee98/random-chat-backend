import {
  Field,
  ID,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { Opinion } from '../entities/opinion.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { Upload } from 'graphql-upload';

@InputType()
export class EditOpinionInput extends PartialType(
  PickType(Opinion, ['title', 'content', 'imageUrls']),
) {
  @Field(() => ID)
  id: string;

  @Field(() => [GraphQLUpload], { nullable: true })
  images?: Array<Upload['promise']>;
}

@ObjectType()
export class EditOpinionOutput extends CoreOutput {
  @Field(() => Opinion, { nullable: true })
  opinion?: Opinion;
}
