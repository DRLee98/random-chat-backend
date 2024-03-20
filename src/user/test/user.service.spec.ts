import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository, MockService, mockRepository } from 'test/utils';
import { User } from '../entites/user.entity';
import { UserService } from '../user.service';
import { AwsService } from 'src/aws/aws.service';
import { CommonService } from 'src/common/common.service';
import { CreateUserInput } from '../dtos/create-user.dto';
import { getProfilePath } from '../utils';
import { Upload } from 'graphql-upload';
import { UpdateUserInput } from '../dtos/update-user.dto';
import { ToggleBlockUserInput } from '../dtos/toggle-block-user.dto';
import { UserProfileInput } from '../dtos/user-profile.dto';
import * as utilFn from '../utils';
import { mockProfile, mockUser } from 'test/mockData';

const uploadFileUrl = 'file url';

const mockAwsService = () => ({
  uploadFile: jest.fn(),
});

describe('UserService 테스트', () => {
  let userService: UserService;
  let userRepository: MockRepository<User>;
  let awsService: MockService<AwsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        CommonService,
        {
          provide: AwsService,
          useValue: mockAwsService(),
        },
      ],
    }).compile();

    userService = module.get(UserService);
    userRepository = module.get(getRepositoryToken(User));
    awsService = module.get(AwsService);
  });

  it('서비스 health check ', () => {
    expect(userService).toBeDefined();
    expect(awsService).toBeDefined();
  });

  describe('유저 생성 테스트', () => {
    const input: CreateUserInput = {
      socialId: mockUser.socialId,
      socialPlatform: mockUser.socialPlatform,
      nickname: mockUser.nickname,
    };

    it('catch 에러', async () => {
      userRepository.findOne.mockRejectedValue('error');

      const result = await userService.createUser(input);

      expect(result.ok).toEqual(false);
      expect(result.user).toEqual(undefined);
      expect(result.error).toEqual('error');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { socialId: input.socialId },
      });

      expect(userRepository.create).toHaveBeenCalledTimes(0);
      expect(userRepository.save).toHaveBeenCalledTimes(0);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(0);
    });

    it('이미 가입한 유저인 경우', async () => {
      userRepository.findOne.mockResolvedValue(input);

      const result = await userService.createUser(input);

      expect(result.ok).toEqual(false);
      expect(result.user).toEqual(undefined);
      expect(typeof result.error).toBe('string');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { socialId: input.socialId },
      });

      expect(userRepository.create).toHaveBeenCalledTimes(0);
      expect(userRepository.save).toHaveBeenCalledTimes(0);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(0);
    });

    it('닉네임이 중복된 경우', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.findOne.mockResolvedValueOnce(input);

      const result = await userService.createUser(input);

      expect(result.ok).toEqual(false);
      expect(result.user).toEqual(undefined);
      expect(typeof result.error).toBe('string');

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { socialId: input.socialId },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: input.nickname },
      });

      expect(userRepository.create).toHaveBeenCalledTimes(0);
      expect(userRepository.save).toHaveBeenCalledTimes(0);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(0);
    });

    it('유저 생성', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(input);
      userRepository.save.mockResolvedValue(input);

      const result = await userService.createUser(input);

      expect(result.ok).toEqual(true);
      expect(result.user).toEqual(input);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { socialId: input.socialId },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: input.nickname },
      });

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(input);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(input);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(0);
    });

    it('유저 생성 (프로필 이미지 업로드)', async () => {
      awsService.uploadFile.mockResolvedValue({ ok: true, url: uploadFileUrl });

      const profile: Upload['promise'] = Promise.resolve({
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: jest.fn(),
      });

      const inputWithProfile = {
        ...input,
        profile,
      };

      const resultUserData = {
        ...input,
        profileUrl: uploadFileUrl,
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(resultUserData);
      userRepository.save.mockResolvedValue(resultUserData);

      const result = await userService.createUser(inputWithProfile);

      expect(result.ok).toEqual(true);
      expect(result.user).toEqual(resultUserData);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { socialId: inputWithProfile.socialId },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: inputWithProfile.nickname },
      });

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(resultUserData);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(resultUserData);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(1);
      expect(awsService.uploadFile).toHaveBeenCalledWith(
        profile,
        getProfilePath(inputWithProfile.socialId),
      );
    });

    it('유저 생성 (프로필 이미지 업로드 실패)', async () => {
      awsService.uploadFile.mockResolvedValue({ ok: false });

      const profile: Upload['promise'] = Promise.resolve({
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: jest.fn(),
      });

      const inputWithProfile = {
        ...input,
        profile,
      };

      const resultUserData = {
        ...input,
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(resultUserData);
      userRepository.save.mockResolvedValue(resultUserData);

      const result = await userService.createUser(inputWithProfile);

      expect(result.ok).toEqual(true);
      expect(result.user).toEqual(resultUserData);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { socialId: inputWithProfile.socialId },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: inputWithProfile.nickname },
      });

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(resultUserData);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(resultUserData);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(1);
      expect(awsService.uploadFile).toHaveBeenCalledWith(
        profile,
        getProfilePath(inputWithProfile.socialId),
      );
    });
  });

  describe('유저 수정 테스트', () => {
    const input: UpdateUserInput = {
      nickname: 'test2',
      bio: 'test bio',
    };

    it('catch 에러', async () => {
      userRepository.findOne.mockRejectedValue('error');

      const result = await userService.updateUser(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(result.error).toEqual('error');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: input.nickname },
      });

      expect(userRepository.update).toHaveBeenCalledTimes(0);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(0);
    });

    it('닉네임이 중복된 경우', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await userService.updateUser(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: input.nickname },
      });

      expect(userRepository.update).toHaveBeenCalledTimes(0);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(0);
    });

    it('유저 수정', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.update.mockReturnValue(input);

      const result = await userService.updateUser(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: input.nickname },
      });

      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, input);

      expect(awsService.uploadFile).toHaveBeenCalledTimes(0);
    });

    it('유저 수정 (프로필 이미지 업로드)', async () => {
      awsService.uploadFile.mockResolvedValue({ ok: true, url: uploadFileUrl });

      const inputWithProfile = {
        ...input,
        profile: mockProfile,
      };

      const inputWithProfileUrl = {
        ...input,
        profileUrl: uploadFileUrl,
      };

      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.update.mockReturnValue(inputWithProfileUrl);

      const result = await userService.updateUser(inputWithProfile, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: input.nickname },
      });

      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        inputWithProfileUrl,
      );

      expect(awsService.uploadFile).toHaveBeenCalledTimes(1);
      expect(awsService.uploadFile).toHaveBeenCalledWith(
        mockProfile,
        getProfilePath(mockUser.socialId),
      );
    });

    it('유저 수정 (프로필 이미지 업로드 실패)', async () => {
      awsService.uploadFile.mockResolvedValue({ ok: false });

      const inputWithProfile = {
        ...input,
        profile: mockProfile,
      };

      const inputWithProfileUrl = {
        ...input,
      };

      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.update.mockReturnValue(inputWithProfileUrl);

      const result = await userService.updateUser(inputWithProfile, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: input.nickname },
      });

      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        inputWithProfileUrl,
      );

      expect(awsService.uploadFile).toHaveBeenCalledTimes(1);
      expect(awsService.uploadFile).toHaveBeenCalledWith(
        mockProfile,
        getProfilePath(mockUser.socialId),
      );
    });
  });

  describe('유저 삭제 테스트', () => {
    it('catch 에러', async () => {
      userRepository.softDelete.mockRejectedValue('error');

      const result = await userService.deleteUser(mockUser);

      expect(result.ok).toEqual(false);
      expect(result.error).toEqual('error');

      expect(userRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(userRepository.softDelete).toHaveBeenCalledWith(mockUser.id);
    });

    it('유저 삭제', async () => {
      const result = await userService.deleteUser(mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(userRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(userRepository.softDelete).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('유저 차단 테스트', () => {
    const input: ToggleBlockUserInput = {
      id: 'block test',
    };

    const blockUser: User = {
      ...mockUser,
      id: input.id,
    };

    it('catch 에러', async () => {
      userRepository.findOne.mockRejectedValue('error');

      const result = await userService.toggleBlockUser(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(result.error).toEqual('error');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);

      expect(userRepository.save).toHaveBeenCalledTimes(0);
    });

    it('차단하려는 유저가 존재하지 않을 경우', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.findOne.mockResolvedValueOnce(null);

      const result = await userService.toggleBlockUser(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenLastCalledWith({
        where: { id: input.id },
      });

      expect(userRepository.save).toHaveBeenCalledTimes(0);
    });

    it('차단하려는 유저가 자기 자신일 경우', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await userService.toggleBlockUser(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenLastCalledWith({
        where: { id: input.id },
      });

      expect(userRepository.save).toHaveBeenCalledTimes(0);
    });

    it('유저 차단', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.findOne.mockResolvedValueOnce(blockUser);

      const result = await userService.toggleBlockUser(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.updateBlockUsers).toEqual([blockUser]);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenLastCalledWith({
        where: { id: input.id },
      });

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        blockUsers: [blockUser],
      });
    });

    it('유저 차단 후 차단 해제', async () => {
      const userData = { ...mockUser };

      userRepository.findOne.mockResolvedValueOnce(userData);
      userRepository.findOne.mockResolvedValueOnce(blockUser);
      userRepository.findOne.mockResolvedValueOnce(userData);
      userRepository.findOne.mockResolvedValueOnce(blockUser);

      const first = await userService.toggleBlockUser(input, userData);

      expect(first.ok).toEqual(true);
      expect(first.updateBlockUsers).toEqual([blockUser]);
      expect(first.error).toEqual(undefined);

      userData.blockUsers = first.updateBlockUsers;

      const second = await userService.toggleBlockUser(input, userData);

      expect(second.ok).toEqual(true);
      expect(second.updateBlockUsers).toEqual([]);
      expect(second.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(4);
      expect(userRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { id: input.id },
      });
      expect(userRepository.findOne).toHaveBeenNthCalledWith(4, {
        where: { id: input.id },
      });

      expect(userRepository.save).toHaveBeenCalledTimes(2);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        blockUsers: [blockUser],
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        blockUsers: [],
      });
    });
  });

  describe('내 정보 조회 테스트', () => {
    it('catch 에러', async () => {
      userRepository.findOne.mockRejectedValue('error');

      const result = await userService.me(mockUser);

      expect(result.ok).toEqual(false);
      expect(result.me).toEqual(undefined);
      expect(result.error).toEqual('error');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('내 정보 조회 실패', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await userService.me(mockUser);

      expect(result.ok).toEqual(false);
      expect(result.me).toEqual(undefined);
      expect(typeof result.error).toBe('string');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('내 정보 조회 (차단 유저 없음)', async () => {
      const { blockUsers: _, ...rest } = mockUser;
      const resultUser = {
        ...rest,
        blockUserIds: [],
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.me(mockUser);

      expect(result.ok).toEqual(true);
      expect(result.me).toEqual(resultUser);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('내 정보 조회 (차단 유저 있음)', async () => {
      const { blockUsers: _, ...rest } = mockUser;
      const resultUser = {
        ...rest,
        blockUserIds: [mockUser.id],
      };

      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        blockUsers: [mockUser],
      });

      const result = await userService.me(mockUser);

      expect(result.ok).toEqual(true);
      expect(result.me).toEqual(resultUser);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });

    describe('내 정보 상세 조회 테스트', () => {
      it('catch 에러', async () => {
        userRepository.findOne.mockRejectedValue('error');

        const result = await userService.meDetail(mockUser);

        expect(result.ok).toEqual(false);
        expect(result.me).toEqual(undefined);
        expect(result.error).toEqual('error');

        expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      });

      it('내 정보 상세 조회', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);

        const result = await userService.meDetail(mockUser);

        expect(result.ok).toEqual(true);
        expect(result.me).toEqual(mockUser);
        expect(result.error).toEqual(undefined);

        expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('유저 정보 조회 테스트', () => {
    const input: UserProfileInput = {
      id: mockUser.id,
    };

    it('catch 에러', async () => {
      userRepository.findOne.mockRejectedValue('error');

      const result = await userService.userProfile(input);

      expect(result.ok).toEqual(false);
      expect(result.user).toEqual(undefined);
      expect(result.error).toEqual('error');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: input.id },
      });
    });

    it('존재하지 않는 유저인 경우', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await userService.userProfile(input);

      expect(result.ok).toEqual(false);
      expect(result.user).toEqual(undefined);
      expect(typeof result.error).toBe('string');

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: input.id },
      });
    });

    it('유저 정보 조회', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.userProfile(input);

      expect(result.ok).toEqual(true);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toEqual(undefined);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: input.id },
      });
    });
  });

  describe('랜덤 닉네임 생성 테스트', () => {
    const spyFn = jest.spyOn(utilFn, 'randomNameGenerator');

    beforeEach(() => {
      spyFn.mockClear();
    });

    it('랜덤 닉네임 생성', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await userService.randomNickname();

      expect(result.ok).toEqual(true);
      expect(typeof result.nickname).toBe('string');

      expect(spyFn).toHaveBeenCalledTimes(1);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { nickname: result.nickname },
      });
    });

    it('랜덤 닉네임 생성 (중복 값이 있을 경우)', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.findOne.mockResolvedValueOnce(null);

      const result = await userService.randomNickname();

      expect(result.ok).toEqual(true);
      expect(typeof result.nickname).toBe('string');

      expect(spyFn).toHaveBeenCalledTimes(2);

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenLastCalledWith({
        where: { nickname: result.nickname },
      });
    });
  });
});
