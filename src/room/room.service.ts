import { Injectable } from '@nestjs/common';
import { Room } from './entites/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from 'src/user/entites/user.entity';
import { UserRoom } from './entites/user-room.entity';
import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/update-room.dto';
import { MyRoomsOutput } from './dtos/my-rooms.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(UserRoom)
    private readonly userRoomRepository: Repository<UserRoom>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async myRooms(user: User): Promise<MyRoomsOutput> {
    try {
      if (!user)
        return {
          ok: false,
          error: '로그인 후 이용해주세요.',
        };

      const rooms = await this.userRoomRepository.find({
        where: {
          user: {
            id: user.id,
          },
        },
        order: {
          pinned: 'DESC',
          updatedAt: 'DESC',
        },
      });

      return {
        ok: true,
        rooms,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async createRandomRoom(loginUser: User): Promise<CreateRandomRoomOutput> {
    try {
      const user = await this.userRepository.findOne({
        select: {
          blockUsers: {
            id: true,
          },
        },
        where: { id: loginUser.id },
        relations: {
          blockUsers: true,
        },
      });

      if (!user)
        return {
          ok: false,
          error: '로그인 후 이용해주세요.',
        };

      // 나를 차단한 유저 목록
      const blockMeUsers = await this.userRepository.find({
        select: {
          id: true,
        },
        where: {
          blockUsers: {
            id: user.id,
          },
        },
      });

      // 현재 로그인한 유저의 방 목록
      const rooms = await this.roomRepository.find({
        select: {
          id: true,
        },
        where: {
          userRooms: {
            user: {
              id: user.id,
            },
          },
        },
      });

      // 이미 채팅중인 유저 목록
      const existingChatUsers = await this.userRoomRepository.find({
        select: {
          user: {
            id: true,
          },
        },
        where: {
          room: {
            id: In(rooms.map((room) => room.id)),
          },
          user: {
            id: Not(user.id),
          },
        },
        relations: {
          user: true,
        },
      });

      const blockIds = [
        ...new Set([
          ...existingChatUsers.map((item) => item.user.id),
          ...user.blockUsers.map((item) => item.id),
          ...blockMeUsers.map((item) => item.id),
          user.id,
        ]),
      ];

      // 채팅 가능한 유저 목록
      const userList = await this.userRepository.find({
        select: { id: true },
        where: { id: Not(In(blockIds)) },
      });

      if (userList.length === 0)
        return {
          ok: false,
          error: '채팅 가능한 유저가 없습니다.',
        };

      // 랜덤한 유저 선택
      const targetUserId =
        userList[Math.floor(Math.random() * userList.length)];
      const targetUser = await this.userRepository.findOne({
        where: { id: targetUserId.id },
      });

      const myRoom = this.userRoomRepository.create({
        user,
        name: targetUser.nickname,
      });

      const targetUserRoom = this.userRoomRepository.create({
        user: targetUser,
        name: user.nickname,
      });

      await this.userRoomRepository.save(myRoom);
      await this.userRoomRepository.save(targetUserRoom);

      const room = this.roomRepository.create({
        userRooms: [myRoom, targetUserRoom],
      });

      await this.roomRepository.save(room);

      return {
        ok: true,
        room: myRoom,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async updateRoom(
    input: UpdateRoomInput,
    user?: User,
  ): Promise<UpdateRoomOutput> {
    try {
      if (!user)
        return {
          ok: false,
          error: '로그인 후 이용해주세요.',
        };

      const existRoom = await this.userRoomRepository.findOne({
        where: {
          id: input.id,
          user: {
            id: user.id,
          },
        },
      });

      if (!existRoom) {
        return {
          ok: false,
          error: '존재하지 않는 방입니다.',
        };
      }

      await this.userRoomRepository.update(input.id, { ...input });

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
