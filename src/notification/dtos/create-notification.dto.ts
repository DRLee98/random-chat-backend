import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { Notification } from '../entities/notification.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateNotificationInput extends OmitType(Notification, [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'read',
  'user',
]) {}

@ObjectType()
export class CreateNotificationOutput extends CoreOutput {
  @Field(() => Notification, { nullable: true })
  notification?: Notification;
}
