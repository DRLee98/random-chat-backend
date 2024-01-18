import { Injectable } from '@nestjs/common';
import { Room } from './entites/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from 'src/user/entites/user.entity';
import { UserRoom } from './entites/user-room.entity';
import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/update-room.dto';
import { MyRoomsOutput } from './dtos/my-rooms.dto';
import { UserService } from 'src/user/user.service';
import { MessageService } from 'src/message/message.service';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(UserRoom)
    private readonly userRoomRepository: Repository<UserRoom>,
    private userService: UserService,
    private messageService: MessageService,
  ) {}

  async myRooms(user: User): Promise<MyRoomsOutput> {
    try {
      const rooms = await this.userRoomRepository.find({
        select: {
          room: {
            id: true,
          },
        },
        where: {
          user: {
            id: user.id,
          },
        },
        order: {
          pinned: 'DESC',
          updatedAt: 'DESC',
        },
        relations: {
          room: true,
        },
      });

      const mapRooms: MyRoomsOutput['rooms'] = await Promise.all(
        rooms.map(async ({ room, ...item }) => {
          const lastMessage = await this.messageService.findLastMessage(
            room.id,
          );
          return {
            ...item,
            room,
            lastMessage,
          };
        }),
      );

      return {
        ok: true,
        rooms: mapRooms,
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
      const user = await this.userService.findUserById(loginUser.id, {
        select: {
          blockUsers: {
            id: true,
          },
        },
        relations: {
          blockUsers: true,
        },
      });

      // 나를 차단한 유저 목록
      const blockMeUsers = await this.userService.findBlockedMe(user.id, {
        select: {
          id: true,
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
      const userList = await this.userService.findChatEnabledUsers(blockIds, {
        select: { id: true },
      });

      if (userList.length === 0)
        return {
          ok: false,
          error: '채팅 가능한 유저가 없습니다.',
        };

      // 랜덤한 유저 선택
      const targetUserId =
        userList[Math.floor(Math.random() * userList.length)];
      const targetUser = await this.userService.findUserById(targetUserId.id);

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
    user: User,
  ): Promise<UpdateRoomOutput> {
    try {
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
