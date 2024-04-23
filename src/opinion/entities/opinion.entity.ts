import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/user/entities/user.entity';

export enum OpinionCategory {
  INQUIRY = 'INQUIRY',
  BUG = 'BUG',
  IMPORVE = 'IMPORVE',
  ETC = 'ETC',
}

export enum OpinionStatus {
  WAITING = 'WAITING',
  READ = 'READ',
  ANSWERED = 'ANSWERED',
}

registerEnumType(OpinionCategory, { name: 'OpinionCategory' });
registerEnumType(OpinionStatus, { name: 'OpinionStatus' });

@InputType('OpinionInputType', { isAbstract: true })
@ObjectType('OpinionObjectType', { isAbstract: true })
@Entity()
export class Opinion extends CoreEntity {
  @Field(() => String)
  @Column()
  title: string;

  @Field(() => String)
  @Column()
  content: string;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, default: [] })
  imageUrls: string[];

  @Field(() => OpinionCategory)
  @Column({
    type: 'enum',
    enum: OpinionCategory,
    default: OpinionCategory.INQUIRY,
  })
  category: OpinionCategory;

  @Field(() => OpinionStatus)
  @Column({
    type: 'enum',
    enum: OpinionStatus,
    default: OpinionStatus.WAITING,
  })
  status: OpinionStatus;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.opinions)
  user: User;
}
