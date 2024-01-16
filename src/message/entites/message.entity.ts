import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entites/core.entity';
import { Room } from 'src/room/entites/room.entity';
import { User } from 'src/user/entites/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

registerEnumType(MessageType, { name: 'MessageType' });

@ObjectType()
@Entity()
export class Message extends CoreEntity {
  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.messages, {
    onDelete: 'CASCADE',
  })
  room: Room;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.messages)
  user: User;

  @Field(() => String)
  @Column()
  contents: string;

  @Field(() => MessageType)
  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;
}
