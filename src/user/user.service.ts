import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const findUser = await this.userRepository.findOne({
        where: { socialId: input.socialId },
      });
      if (findUser) {
        return {
          ok: false,
          error: '이미 가입된 계정입니다.',
        };
      }

      let nickname = '';
      while (true) {
        nickname = randomNameGenerator();
        const findNickname = await this.userRepository.findOne({
          where: { nickname },
        });
        if (!findNickname) break;
      }

      const user = this.userRepository.create({
        ...input,
        nickname,
      });

      await this.userRepository.save(user);

      return {
        ok: true,
        user,
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  async updateUser(
    input: UpdateUserInput,
    user?: User,
  ): Promise<UpdateUserOutput> {
    try {
      if (!user)
        return {
          ok: false,
          error: '로그인 후 이용해주세요.',
        };

      if (input.nickname) {
        const existNickname = await this.userRepository.findOne({
          where: { nickname: input.nickname },
        });
        if (existNickname) {
          return {
            ok: false,
            error: '이미 사용중인 닉네임입니다.',
          };
        }
      }

      await this.userRepository.update(user.id, { ...input });

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async deleteUser(user: User): Promise<DeleteUserOutput> {
    try {
      await this.userRepository.delete(user.id);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async toggleBlockUser(
    input: ToggleBlockUserInput,
    loginUser?: User,
  ): Promise<ToggleBlockUserOutput> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: loginUser.id },
        relations: ['blockUsers'],
      });

      if (!user)
        return {
          ok: false,
          error: '로그인 후 이용해주세요.',
        };

      const targetUser = await this.findUserById(input.id);

      if (!targetUser) {
        return {
          ok: false,
          error: '존재하지 않는 유저입니다.',
        };
      }

      if (targetUser.id === user.id) {
        return {
          ok: false,
          error: '자기 자신을 차단할 수 없습니다.',
        };
      }

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
      return {
        ok: false,
        error,
      };
    }
  }

  me(user?: User): MeOutput {
    try {
      if (user) {
        return {
          ok: true,
          me: user,
        };
      }
      return {
        ok: false,
        error: '로그인 후 이용해주세요.',
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async userProfile(input: UserProfileInput): Promise<UserProfileOutput> {
    try {
      const findUser = await this.findUserById(input.id);

      if (!findUser) {
        return {
          ok: false,
          error: '존재하지 않는 유저입니다.',
        };
      }

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

  async findUserById(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user ?? null;
  }

  async findUserBySocialId(
    socialId: string,
    socialPlatform: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { socialId, socialPlatform },
    });
    return user ?? null;
  }

  // 데이터 추가용
  async createManyUser(number: number) {
    try {
      for (let i = 0; i < number; i++) {
        await this.createUser({
          socialId: `${new Date().getTime()}${i}`,
          socialPlatform: 'naver',
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
