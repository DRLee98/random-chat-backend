import { Upload } from 'graphql-upload';
import { AccusationInfo } from 'src/accusation/entities/accusation-info.entity';
import {
  Accusation,
  AccusationStatus,
} from 'src/accusation/entities/accusation.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { Invite, InviteStatus } from 'src/invite/entities/invite.entity';
import { Notice, NoticeCategory } from 'src/notice/entities/notice.entity';
import {
  Notification,
  NotificationType,
} from 'src/notification/entities/notification.entity';
import {
  Opinion,
  OpinionCategory,
  OpinionStatus,
} from 'src/opinion/entities/opinion.entity';
import { Reply } from 'src/reply/entities/reply.entity';
import { MyRoom } from 'src/room/dtos/my-rooms.dto';
import { Room } from 'src/room/entities/room.entity';
import { UserRoom } from 'src/room/entities/user-room.entity';
import { Language, SocialPlatform, User } from 'src/user/entities/user.entity';

export const mockUser: User = {
  id: 'xx',
  socialId: 'xxxx',
  socialPlatform: SocialPlatform.NAVER,
  fcmToken: 'token',
  nickname: 'test',
  profileBgColor: '#000000',
  profileTextColor: '#ffffff',
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
  opinions: [],
  invites: [],
  accusationInfo: null,
  suspensionEndAt: null,
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
  profileBgColor: '#000000',
  profileTextColor: '#ffffff',
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
  opinions: [],
  invites: [],
  accusationInfo: null,
  suspensionEndAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockImage: Upload['promise'] = Promise.resolve({
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

export const mockOpinion: Opinion = {
  id: '1',
  title: 'title',
  content: 'content',
  imageUrls: [],
  category: OpinionCategory.INQUIRY,
  status: OpinionStatus.WAITING,
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockOpinion2: Opinion = {
  id: '2',
  title: 'title2',
  content: 'content2',
  imageUrls: [],
  category: OpinionCategory.BUG,
  status: OpinionStatus.READ,
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockOpinion3: Opinion = {
  id: '3',
  title: 'title3',
  content: 'content3',
  imageUrls: [],
  category: OpinionCategory.ETC,
  status: OpinionStatus.ANSWERED,
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockRoom: Room = {
  id: '1',
  userRooms: [],
  messages: [],
  invites: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockUserRoom: UserRoom = {
  id: '1',
  room: mockRoom,
  noti: true,
  newMessage: 0,
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockInvite: Invite = {
  id: '1',
  status: InviteStatus.WAIT,
  room: mockRoom,
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockInvite2: Invite = {
  id: '2',
  status: InviteStatus.WAIT,
  room: mockRoom,
  user: mockUser2,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockInviteRoom = {
  ...mockRoom,
  invites: [mockInvite, mockInvite2],
};

export const mockMyRoom: MyRoom = {
  id: '1',
  room: mockRoom,
  noti: true,
  newMessage: 0,
  users: [mockUser, mockUser2],
  lastMessage: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockAccusationInfo: AccusationInfo = {
  id: '1',
  count: 0,
  showAlert: false,
  user: mockUser,
  accusations: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockAccusation: Accusation = {
  id: '1',
  authorId: mockUser.id,
  content: 'test',
  imageUrls: [],
  status: AccusationStatus.WAIT,
  answer: '',
  info: mockAccusationInfo,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};
