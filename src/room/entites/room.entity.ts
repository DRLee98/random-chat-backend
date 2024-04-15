import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Entity, OneToMany } from 'typeorm';

import { CoreEntity } from 'src/common/entites/core.entity';
import { Message } from 'src/message/entites/message.entity';
import { UserRoom } from './user-room.entity';

@InputType('RoomInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Room extends CoreEntity {
  @Field(() => [UserRoom])
  @OneToMany(() => UserRoom, (userRoom) => userRoom.room)
  userRooms: UserRoom[];

  @Field(() => [Message])
  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];
}
