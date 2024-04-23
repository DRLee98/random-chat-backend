import { Upload } from 'graphql-upload';
import { Comment } from 'src/comment/entities/comment.entity';
import { Notice, NoticeCategory } from 'src/notice/entities/notice.entity';
import {
  Notification,
  NotificationType,
} from 'src/notification/entities/notification.entity';
import { Reply } from 'src/reply/entities/reply.entity';
import { Language, SocialPlatform, User } from 'src/user/entities/user.entity';

export const mockUser: User = {
  id: 'xx',
  socialId: 'xxxx',
  socialPlatform: SocialPlatform.NAVER,
  fcmToken: 'token',
  nickname: 'test',
  noti: true,
  allowMessage: true,
  language: Language.ko,
  autoTranslation: false,
  blockUsers: [],
  rooms: [],
  messages: [],
  notifications: [],
  comments: [],
  replies: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockUser2: User = {
  id: '2test',
  socialId: '2222',
  socialPlatform: SocialPlatform.KAKAO,
  fcmToken: 'token2',
  nickname: 'test22',
  noti: true,
  allowMessage: true,
  language: Language.ko,
  autoTranslation: false,
  blockUsers: [],
  rooms: [],
  messages: [],
  notifications: [],
  comments: [],
  replies: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockProfile: Upload['promise'] = Promise.resolve({
  filename: 'test.jpg',
  mimetype: 'image/jpeg',
  encoding: '7bit',
  createReadStream: jest.fn(),
});

export const mockNotice: Notice = {
  id: '1',
  title: 'title',
  content: 'content',
  category: NoticeCategory.INFO,
  pinned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockNotification: Notification = {
  id: '1',
  title: 'title',
  message: 'message',
  type: NotificationType.SYSTEM,
  read: false,
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockComment: Comment = {
  id: '1',
  text: 'test',
  postId: '1',
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  replies: [],
};

export const mockReply: Reply = {
  id: '1',
  text: 'test',
  comment: mockComment,
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};
