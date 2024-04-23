import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
export class UploadFilesOutput extends CoreOutput {
  @Field(() => [String], { nullable: true })
  urls?: string[];
}
