import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity } from 'typeorm';

import { CoreEntity } from 'src/common/entites/core.entity';

export enum NoticeCategory {
  INFO = 'INFO',
  EVENT = 'EVENT',
  UPDATE = 'UPDATE',
  INSPECTION = 'INSPECTION',
}

registerEnumType(NoticeCategory, { name: 'NoticeCategory' });

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

  @Field(() => NoticeCategory)
  @Column({ type: 'enum', enum: NoticeCategory, default: NoticeCategory.INFO })
  category: NoticeCategory;

  @Field(() => Boolean, { nullable: true })
  @Column({ default: false })
  pinned?: boolean;
}
