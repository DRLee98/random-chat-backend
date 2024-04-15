import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity } from 'typeorm';

import { CoreEntity } from 'src/common/entites/core.entity';

@InputType('NoticeInputType', { isAbstract: true })
@ObjectType('NoticeObjectType', { isAbstract: true })
@Entity()
export class Notice extends CoreEntity {
  @Field(() => String)
  @Column()
  title: string;

  @Field(() => String)
  @Column()
  content: string;

  //   @Field(() => String, { nullable: true })
  //   @Column({nullable: true})
  //   image?: string;

  @Field(() => Boolean, { nullable: true })
  @Column({ default: false })
  pinned?: Boolean;
}
