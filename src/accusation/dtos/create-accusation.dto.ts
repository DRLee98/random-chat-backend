import { Field, ID, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Accusation } from '../entities/accusation.entity';

import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { Upload } from 'graphql-upload';

@InputType()
export class CreateAccusationInput extends PickType(Accusation, ['content']) {
  @Field(() => ID)
  targetUserId: string;

  @Field(() => [GraphQLUpload], { nullable: true })
  images?: Array<Upload['promise']>;
}

@ObjectType()
export class CreateAccusationOutput extends CoreOutput {}
