import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Opinion } from '../entities/opinion.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class OpinionDetailInput extends PickType(Opinion, ['id']) {}

@ObjectType()
export class OpinionDetailOutput extends CoreOutput {
  @Field(() => Opinion, { nullable: true })
  opinion?: Opinion;
}
