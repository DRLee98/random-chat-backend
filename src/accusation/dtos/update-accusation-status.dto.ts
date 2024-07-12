import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Accusation } from '../entities/accusation.entity';

@InputType()
export class UpdateAccusationStatusInput extends PickType(Accusation, [
  'id',
  'status',
  'answer',
]) {
  @Field(() => String)
  password: string;
}

@ObjectType()
export class UpdateAccusationStatusOutput extends CoreOutput {}
