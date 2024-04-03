import { Upload } from 'graphql-upload';
import { Language, SocialPlatform, User } from 'src/user/entites/user.entity';

export const mockUser: User = {
  id: 'xx',
  socialId: 'xxxx',
  socialPlatform: SocialPlatform.NAVER,
  fcmToken: 'token',
  nickname: 'test',
  allowMessage: true,
  language: Language.ko,
  autoTranslation: false,
  blockUsers: [],
  rooms: [],
  messages: [],
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
