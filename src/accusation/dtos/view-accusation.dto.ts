import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Accusation } from '../entities/accusation.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class ViewAccusationInput {
  @Field(() => String)
  password: string;

  @Field(() => ID)
  id: string;
}

@ObjectType()
export class ViewAccusationOutput extends CoreOutput {
  @Field(() => Accusation, { nullable: true })
  accusation?: Accusation;
}
