import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entites/user.entity';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { UpdateUserInput, UpdateUserOutput } from './dtos/update-user.dto';

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
        // TODO: 기존에 가입된 계정으로 로그인 처리
        return {
          ok: false,
          error: '이미 가입된 계정입니다.',
        };
      }
      const user = this.userRepository.create({ ...input });

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

  async updateUser(input: UpdateUserInput): Promise<UpdateUserOutput> {
    try {
      // TODO: 로그인 체크하고 로그인된 유저 정보를 변경하도록 수정 필요
      await this.userRepository.update(1, { ...input });

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
}
