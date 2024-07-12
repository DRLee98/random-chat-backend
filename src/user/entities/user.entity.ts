import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { Message } from 'src/message/entities/message.entity';
import { UserRoom } from 'src/room/entities/user-room.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { Reply } from 'src/reply/entities/reply.entity';
import { Opinion } from 'src/opinion/entities/opinion.entity';
import { Invite } from 'src/invite/entities/invite.entity';
import { AccusationInfo } from 'src/accusation/entities/accusation-info.entity';

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
  @Column()
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

  @Field(() => String)
  @Column()
  profileBgColor: string;

  @Field(() => String)
  @Column()
  profileTextColor: string;

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

  @Field(() => [Invite])
  @OneToMany(() => Invite, (invite) => invite.user)
  invites: Invite[];

  @Field(() => [Message])
  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @Field(() => [Notification])
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @Field(() => [Comment])
  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @Field(() => [Reply])
  @OneToMany(() => Reply, (reply) => reply.user)
  replies: Reply[];

  @Field(() => [Opinion])
  @OneToMany(() => Opinion, (opinion) => opinion.user)
  opinions: Opinion[];

  @Field(() => AccusationInfo)
  @OneToOne(() => AccusationInfo, (accusationInfo) => accusationInfo.user)
  @JoinColumn()
  accusationInfo: AccusationInfo;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', default: null })
  suspensionEndAt: Date | null;
}
