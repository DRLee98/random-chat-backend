import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Opinion } from '../entities/opinion.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteOpinionInput extends PickType(Opinion, ['id']) {}

@ObjectType()
export class DeleteOpinionOutput extends CoreOutput {}
