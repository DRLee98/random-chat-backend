import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entites/core.entity';
import { Column, Entity, ManyToMany } from 'typeorm';

@InputType('UserInputType', { isAbstract: true })
@ObjectType('UserObjectType', { isAbstract: true })
@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  socialId: string;

  @Field(() => String)
  @Column()
  socialPlatform: string;

  @Field(() => String)
  @Column({ unique: true })
  nickname: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  bio?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  profileUrl?: string;

  @Field(() => Boolean)
  @Column({ default: true })
  allowMessage: boolean;

  @Field(() => [User])
  @ManyToMany(() => User)
  blockUsers: User[];
}
