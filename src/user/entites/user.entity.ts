import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { CoreEntity } from 'src/common/entites/core.entity';
import { Message } from 'src/message/entites/message.entity';
import { UserRoom } from 'src/room/entites/user-room.entity';

export enum Language {
  ko = 'ko', // 한국어
  en = 'en', // 영어
  ja = 'ja', // 일본어
  zhCN = 'zh-CN', // 중국어 간체
  zhTW = 'zh-TW', // 중국어 번체
  vi = 'vi', // 베트남어
  id = 'id', // 인도네시아어
  th = 'th', // 태국어
  de = 'de', // 독일어
  ru = 'ru', // 러시아어
  es = 'es', // 스페인어
  it = 'it', // 이탈리아어
  fr = 'fr', // 프랑스어
}

export enum SocialPlatform {
  NAVER = 'NAVER',
  KAKAO = 'KAKAO',
  APPLE = 'APPLE',
}

registerEnumType(Language, { name: 'Language' });
registerEnumType(SocialPlatform, { name: 'SocialPlatform' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType('UserObjectType', { isAbstract: true })
@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  socialId: string;

  @Field(() => SocialPlatform)
  @Column({ type: 'enum', enum: SocialPlatform })
  socialPlatform: SocialPlatform;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  fcmToken?: string;

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
  noti: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  allowMessage: boolean;

  @Field(() => [User])
  @ManyToMany(() => User)
  @JoinTable()
  blockUsers: User[];

  @Field(() => Language)
  @Column({ type: 'enum', enum: Language, default: Language.ko })
  language: Language;

  @Field(() => Boolean)
  @Column({ default: false })
  autoTranslation: boolean;

  @Field(() => [UserRoom])
  @OneToMany(() => UserRoom, (room) => room.user)
  rooms: UserRoom[];

  @Field(() => [Message])
  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];
}
