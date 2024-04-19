import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/user/entities/user.entity';
import { Room } from './room.entity';

@InputType('UserRoomInputType', { isAbstract: true })
@ObjectType('UserRoomObjectType', { isAbstract: true })
@Entity()
export class UserRoom extends CoreEntity {
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.rooms)
  user: User;

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.userRooms)
  room: Room;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field(() => Boolean)
  @Column({ default: true })
  noti: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ default: null })
  pinnedAt?: Date;

  @Field(() => Number)
  @Column({ default: 0 })
  newMessage: number;
}
