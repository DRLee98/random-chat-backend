import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/user/entities/user.entity';

import JSON from 'graphql-type-json';

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
  ROOM = 'ROOM',
  MESSAGE = 'MESSAGE',
  OPINION = 'OPINION',
  INVITE = 'INVITE',
  ACCUSATION = 'ACCUSATION',
}

registerEnumType(NotificationType, { name: 'NotificationType' });

@InputType('NotificationInputType', { isAbstract: true })
@ObjectType('NotificationObjectType', { isAbstract: true })
@Entity()
export class Notification extends CoreEntity {
  @Field(() => String)
  @Column()
  title: string;

  @Field(() => String)
  @Column()
  message: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  imageUrl?: string;

  @Field(() => JSON, { nullable: true })
  @Column({ type: 'json', nullable: true })
  data?: Record<string, string>;

  @Field(() => NotificationType)
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Field(() => Boolean)
  @Column({ default: false })
  read: boolean;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.notifications)
  user: User;
}
