import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entites/core.entity';
import { User } from 'src/user/entites/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Room } from './room.entity';

@InputType('UserRoomInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class UserRoom extends CoreEntity {
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.rooms)
  user: User;

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.userRooms)
  room: Room;

  @Field(() => String)
  @Column()
  name: string;

  @Field(() => Boolean)
  @Column({ default: true })
  noti: boolean;

  @Field(() => Boolean)
  @Column({ default: false })
  pinned: boolean;

  @Field(() => Number)
  @Column({ default: 0 })
  newMessage: number;
}
