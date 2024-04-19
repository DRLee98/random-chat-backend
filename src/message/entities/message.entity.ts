import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/user/entities/user.entity';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

registerEnumType(MessageType, { name: 'MessageType' });

@InputType('MessageInputType', { isAbstract: true })
@ObjectType('MessageObjectType', { isAbstract: true })
@Entity()
export class Message extends CoreEntity {
  @Field(() => String)
  @Column()
  contents: string;

  @Field(() => MessageType)
  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Field(() => [ID], { defaultValue: [] })
  @Column('text', { array: true, default: [] })
  readUsersId: string[];

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.messages, {
    onDelete: 'CASCADE',
  })
  room: Room;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.messages)
  user: User;
}
