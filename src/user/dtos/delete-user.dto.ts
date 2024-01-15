import { ObjectType } from '@nestjs/graphql';
import { CoreOutPut } from 'src/common/dtos/output.dto';

@ObjectType()
export class DeleteUserOutput extends CoreOutPut {}
