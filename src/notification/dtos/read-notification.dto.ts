import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Notification } from '../entities/notification.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class ReadNotificationInput extends PickType(Notification, ['id']) {}

@ObjectType()
export class ReadNotificationOutput extends CoreOutput {}
