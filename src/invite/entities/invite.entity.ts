import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/user/entities/user.entity';

export enum InviteStatus {
  WAIT = 'WAIT',
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

registerEnumType(InviteStatus, { name: 'InviteStatus' });

@InputType('InviteInputType', { isAbstract: true })
@ObjectType('InviteObjectType', { isAbstract: true })
@Entity()
export class Invite extends CoreEntity {
  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.invites, { onDelete: 'CASCADE' })
  room: Room;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.invites, { onDelete: 'CASCADE' })
  user: User;

  @Field(() => InviteStatus)
  @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.WAIT })
  status: InviteStatus;
}
