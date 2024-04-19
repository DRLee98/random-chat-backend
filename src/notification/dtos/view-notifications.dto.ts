import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Notification } from '../entities/notification.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';

@InputType()
export class ViewNotificationsInput extends PaginationInput {}

@ObjectType()
export class ViewNotificationsOutput extends PaginationOutput {
  @Field(() => [Notification], { nullable: true })
  notifications?: Notification[];
}
