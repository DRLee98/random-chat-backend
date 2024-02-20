import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, In, Not, Repository } from 'typeorm';
import { User } from './entites/user.entity';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { UpdateUserInput, UpdateUserOutput } from './dtos/update-user.dto';
import { randomNameGenerator } from './utils/nameGenerator';
import { MeOutput } from './dtos/me.dto';
import { DeleteUserOutput } from './dtos/delete-user.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import {
  ToggleBlockUserInput,
  ToggleBlockUserOutput,
} from './dtos/toggle-block-user.dto';
import { CommonService } from 'src/common/common.service';
import { RandomNicknameOutput } from './dtos/random-nickname.dto';
import { AwsService } from 'src/aws/aws.service';

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
          `user-profile/${input.socialId}`,
        );
        if (result.ok) {
          profileUrl = result.url;
        }
      }

      const user = this.userRepository.create({
        ...input,
        profileUrl,
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
    input: UpdateUserInput,
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

      await this.userRepository.update(user.id, { ...input });

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
        where: { id: loginUser.id },
        relations: ['blockUsers'],
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

      user.blockUsers = updateBlockUsers;

      await this.userRepository.save(user);

      return {
        ok: true,
        updateBlockUsers,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  me(user: User): MeOutput {
    try {
      return {
        ok: true,
        me: user,
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
    id: number,
    options?: Omit<FindOneOptions<User>, 'were'>,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      ...options,
      where: { id },
    });
    return user ?? null;
  }

  async findUserBySocialId(
    socialId: string,
    socialPlatform: string,
    options?: Omit<FindOneOptions<User>, 'were'>,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { socialId, socialPlatform },
      ...options,
    });
    return user ?? null;
  }

  async findBlockedMe(
    id: number,
    options?: Omit<FindOneOptions<User>, 'were'>,
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
    blockIds: number[],
    options?: Omit<FindOneOptions<User>, 'were'>,
  ): Promise<User[]> {
    const user = await this.userRepository.find({
      ...options,
      where: { id: Not(In(blockIds)), allowMessage: true },
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

  // 데이터 추가용
  async createManyUser(number: number) {
    try {
      for (let i = 0; i < number; i++) {
        await this.createUser({
          socialId: `${new Date().getTime()}${i}`,
          socialPlatform: 'naver',
          nickname: randomNameGenerator(),
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
