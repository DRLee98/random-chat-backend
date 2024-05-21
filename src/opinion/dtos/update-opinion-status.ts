import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Opinion } from '../entities/opinion.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class UpdateOpinionStatusInput extends PickType(Opinion, [
  'id',
  'status',
]) {
  @Field(() => String)
  password: string;
}

@ObjectType()
export class UpdateOpinionStatusOutput extends CoreOutput {}
