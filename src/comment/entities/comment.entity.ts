import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/user/entities/user.entity';
import { Reply } from 'src/reply/entities/reply.entity';

@InputType('CommentInputType', { isAbstract: true })
@ObjectType('CommentObjectType', { isAbstract: true })
@Entity()
export class Comment extends CoreEntity {
  @Field(() => String)
  @Column()
  text: string;

  @Field(() => ID)
  @Column()
  postId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.comments)
  user: User;

  @Field(() => [Reply])
  @OneToMany(() => Reply, (reply) => reply.comment)
  replies: Reply[];
}
