import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { AccusationInfo } from './accusation-info.entity';

export enum AccusationStatus {
  WAIT = 'WAIT',
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

registerEnumType(AccusationStatus, { name: 'AccusationStatus' });

@InputType('AccusationInputType', { isAbstract: true })
@ObjectType('AccusationObjectType', { isAbstract: true })
@Entity()
export class Accusation extends CoreEntity {
  @Field(() => AccusationInfo)
  @ManyToOne(() => AccusationInfo, (info) => info.accusations, {
    onDelete: 'CASCADE',
  })
  info: AccusationInfo;

  @Field(() => ID)
  @Column()
  authorId: string;

  @Field(() => String)
  @Column()
  content: string;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, default: [] })
  imageUrls: string[];

  @Field(() => AccusationStatus)
  @Column({
    type: 'enum',
    enum: AccusationStatus,
    default: AccusationStatus.WAIT,
  })
  status: AccusationStatus;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  answer?: string;
}
