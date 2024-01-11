import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entites/core.entity';
import { Column, Entity, ManyToMany } from 'typeorm';

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  socialId: String;

  @Field(() => String)
  @Column()
  socialPlatform: String;

  @Field(() => String)
  @Column({ unique: true })
  nickname: String;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  bio?: String;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  profileUrl?: String;

  @Field(() => Boolean)
  @Column({ default: true })
  allowMessage: Boolean;

  @Field(() => [User])
  @ManyToMany((type) => User)
  blockUsers: User[];
}
