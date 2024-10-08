import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
export class UploadFileOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  url?: string;
}
