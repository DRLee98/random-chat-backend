import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entites/core.entity';
import { User } from 'src/user/entites/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
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

  @Field(() => String)
  @Column()
  name: string;

  @Field(() => Boolean)
  @Column({ default: true })
  noti: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ default: null })
  pinnedAt: Date;

  @Field(() => Number)
  @Column({ default: 0 })
  newMessage: number;
}
