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
}
