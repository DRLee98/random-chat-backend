import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class PasswordCheckInput {
  @Field(() => String)
  password: string;
}

@ObjectType()
export class PasswordCheckOutput extends CoreOutput {}
