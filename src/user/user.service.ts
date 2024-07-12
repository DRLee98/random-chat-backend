import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, In, Not, Repository } from 'typeorm';

import { AwsService } from 'src/aws/aws.service';
import { CommonService } from 'src/common/common.service';

import { SocialPlatform, User } from './entities/user.entity';

import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { UpdateUserInput, UpdateUserOutput } from './dtos/update-user.dto';
import { MeOutput } from './dtos/me.dto';
import { DeleteUserOutput } from './dtos/delete-user.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import {
  ToggleBlockUserInput,
  ToggleBlockUserOutput,
} from './dtos/toggle-block-user.dto';
import { RandomNicknameOutput } from './dtos/random-nickname.dto';
import { MeDetailOutput } from './dtos/me-detail.dto';

import { getProfilePath, randomNameGenerator } from './utils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly commonService: CommonService,
    private readonly awsService: AwsService,
  ) {}

  async createUser({
    profile,
    ...input
  }: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const findUser = await this.userRepository.findOne({
        where: { socialId: input.socialId },
      });
      if (findUser) return this.commonService.error('이미 가입된 계정입니다.');

      const findNickname = await this.userRepository.findOne({
        where: { nickname: input.nickname },
      });

      if (findNickname)
        return this.commonService.error('이미 사용중인 닉네임입니다.');

      let profileUrl = null;
      if (profile) {
        const result = await this.awsService.uploadFile(
          profile,
          getProfilePath(input.socialId),
        );
        if (result.ok) {
          profileUrl = result.url;
        }
      }

      const user = this.userRepository.create({
        ...input,
        ...(profileUrl && { profileUrl }),
      });

      await this.userRepository.save(user);

      return {
        ok: true,
        user,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async updateUser(
    { profile, ...input }: UpdateUserInput,
    user: User,
  ): Promise<UpdateUserOutput> {
    try {
      if (input.nickname) {
        const existNickname = await this.userRepository.findOne({
          where: { nickname: input.nickname },
        });
        if (existNickname)
          return this.commonService.error('이미 사용중인 닉네임입니다.');
      }

      let profileUrl = null;
      if (profile) {
        const result = await this.awsService.uploadFile(
          profile,
          getProfilePath(user.socialId),
        );
        if (result.ok) {
          profileUrl = result.url;
        }
      }

      await this.userRepository.update(user.id, {
        ...input,
        ...(profileUrl && { profileUrl }),
      });

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async deleteUser(user: User): Promise<DeleteUserOutput> {
    try {
      await this.userRepository.softDelete(user.id);

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async toggleBlockUser(
    input: ToggleBlockUserInput,
    loginUser: User,
  ): Promise<ToggleBlockUserOutput> {
    try {
      const user = await this.userRepository.findOne({
        select: {
          blockUsers: {
            id: true,
            nickname: true,
            bio: true,
            profileUrl: true,
            profileBgColor: true,
            profileTextColor: true,
          },
        },
        where: { id: loginUser.id },
        relations: {
          blockUsers: true,
        },
      });

      const targetUser = await this.findUserById(input.id);

      if (!targetUser)
        return this.commonService.error('존재하지 않는 유저입니다.');

      if (targetUser.id === user.id)
        return this.commonService.error('자기 자신을 차단할 수 없습니다.');

      let updateBlockUsers = [...(user.blockUsers ?? [])];
      if (updateBlockUsers.some(({ id }) => id === targetUser.id)) {
        updateBlockUsers = updateBlockUsers.filter(
          ({ id }) => id !== targetUser.id,
        );
      } else {
        updateBlockUsers.push(targetUser);
      }

      await this.userRepository.save({ ...user, blockUsers: updateBlockUsers });

      return {
        ok: true,
        updateBlockUsers,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async me(user: User): Promise<MeOutput> {
    try {
      const loadUser = await this.userRepository.findOne({
        select: {
          blockUsers: {
            id: true,
          },
          id: true,
          nickname: true,
          profileUrl: true,
          profileBgColor: true,
          profileTextColor: true,
        },
        where: { id: user.id },
        relations: {
          blockUsers: true,
        },
      });

      if (!loadUser)
        return this.commonService.error('존재하지 않는 유저입니다.');

      const { blockUsers, ...rest } = loadUser;

      return {
        ok: true,
        me: { ...rest, blockUserIds: blockUsers.map(({ id }) => id) },
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async meDetail(user: User): Promise<MeDetailOutput> {
    try {
      const me = await this.userRepository.findOne({
        select: {
          blockUsers: {
            id: true,
            nickname: true,
            bio: true,
            profileUrl: true,
            profileBgColor: true,
            profileTextColor: true,
          },
        },
        where: {
          id: user.id,
        },
        relations: {
          blockUsers: true,
        },
      });

      return {
        ok: true,
        me,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async userProfile(input: UserProfileInput): Promise<UserProfileOutput> {
    try {
      const findUser = await this.findUserById(input.id);

      if (!findUser)
        return this.commonService.error('존재하지 않는 유저입니다.');

      return {
        ok: true,
        user: findUser,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findUserById(
    id: string,
    options?: Omit<FindOneOptions<User>, 'where'>,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      ...options,
      where: { id },
    });
    return user ?? null;
  }

  async findUserBySocialId(
    socialId: string,
    socialPlatform: SocialPlatform,
    options?: Omit<FindOneOptions<User>, 'where'>,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { socialId, socialPlatform },
      ...options,
    });
    return user ?? null;
  }

  async findBlockedMe(
    id: string,
    options?: Omit<FindOneOptions<User>, 'where'>,
  ): Promise<User[]> {
    const user = await this.userRepository.find({
      ...options,
      where: {
        blockUsers: {
          id,
        },
      },
    });
    return user;
  }

  async findChatEnabledUsers(
    blockIds: string[],
    options?: Omit<FindOneOptions<User>, 'where'>,
  ): Promise<User[]> {
    const userCount = await this.userRepository.count({
      ...options,
      where: { id: Not(In(blockIds)), allowMessage: true },
    });

    const skip = Math.floor(Math.random() * (userCount - 50));

    const user = await this.userRepository.find({
      ...options,
      where: { id: Not(In(blockIds)), allowMessage: true },
      skip: skip > 0 ? skip : 0,
      take: 50,
    });

    return user;
  }

  async findUserByRoomId(
    id: string,
    options?: Omit<FindOneOptions<User>, 'where'>,
    filterIds?: string[],
  ): Promise<User[]> {
    const user = await this.userRepository.find({
      ...options,
      where: {
        ...(filterIds && { id: Not(In(filterIds)) }),
        rooms: {
          room: {
            id,
          },
        },
      },
    });
    return user;
  }

  async findUserByUserRoomId(
    ids: string[],
    options?: Omit<FindOneOptions<User>, 'where'>,
  ): Promise<User[]> {
    const user = await this.userRepository.find({
      ...options,
      where: {
        rooms: {
          id: In(ids),
        },
      },
    });
    return user;
  }

  async randomNickname(): Promise<RandomNicknameOutput> {
    try {
      let nickname = '';
      while (true) {
        nickname = randomNameGenerator();
        const findNickname = await this.userRepository.findOne({
          where: { nickname },
        });
        if (!findNickname) break;
      }

      return {
        ok: true,
        nickname,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async existingChatUserIds(userId: string) {
    const user = await this.userRepository.findOne({
      select: {
        rooms: {
          id: true,
          room: {
            id: true,
          },
        },
      },
      where: {
        id: userId,
      },
      relations: {
        rooms: {
          room: true,
        },
      },
    });

    const roomIds = user.rooms.map((item) => item.room.id);

    // 이미 채팅중인 유저 목록
    const existingChatUsers = await this.userRepository.find({
      select: {
        rooms: {
          id: true,
          room: {
            id: true,
          },
        },
      },
      where: {
        id: Not(userId),
        rooms: {
          room: {
            id: In(roomIds),
          },
        },
      },
      relations: {
        rooms: {
          room: true,
        },
      },
    });

    return existingChatUsers.map((item) => item.id);
  }

  async suspendUserUntilDate(userId: string, endDate: Date) {
    await this.userRepository.update(userId, {
      suspensionEndAt: endDate,
    });
  }
}
