import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@InputType('ReplyInputType', { isAbstract: true })
@ObjectType('ReplyObjectType', { isAbstract: true })
@Entity()
export class Reply extends CoreEntity {
  @Field(() => String)
  @Column()
  text: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.replies)
  user: User;

  @Field(() => Comment)
  @ManyToOne(() => Comment, (comment) => comment.replies)
  comment: Comment;
}
