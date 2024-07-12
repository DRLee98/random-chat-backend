import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/user/entities/user.entity';
import { Accusation } from './accusation.entity';

@InputType('AccusationInfoInputType', { isAbstract: true })
@ObjectType('AccusationInfoObjectType', { isAbstract: true })
@Entity()
export class AccusationInfo extends CoreEntity {
  @Field(() => User)
  @OneToOne(() => User, (user) => user.accusationInfo, { onDelete: 'CASCADE' })
  user: User;

  @Field(() => Number)
  @Column({ default: 0 })
  count: number;

  @Field(() => Boolean)
  @Column({ default: false })
  showAlert: boolean;

  @Field(() => [Accusation])
  @OneToMany(() => Accusation, (accusation) => accusation.info)
  accusations: Accusation[];
}
