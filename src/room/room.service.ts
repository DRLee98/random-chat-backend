import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Room } from './entites/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from 'src/user/entites/user.entity';
import { UserRoom } from './entites/user-room.entity';
import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/update-room.dto';
import { MyRoomsInput, MyRoomsOutput } from './dtos/my-rooms.dto';
import { UserService } from 'src/user/user.service';
import { MessageService } from 'src/message/message.service';
import { CommonService } from 'src/common/common.service';
import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { NEW_ROOM, UPDATE_NEW_MESSAGE } from './room.constants';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(UserRoom)
    private readonly userRoomRepository: Repository<UserRoom>,
    private readonly commonService: CommonService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async myRooms(input: MyRoomsInput, user: User): Promise<MyRoomsOutput> {
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
          user: false,
        },
        ...this.commonService.paginationOption(input),
      });

      const mapRooms: MyRoomsOutput['rooms'] = await Promise.all(
        rooms.map(async ({ room, ...item }) => {
          const lastMessage = await this.messageService.findLastMessage(
            room.id,
          );
          const users = await this.userService.findUserByRoomId(room.id, {
            select: {
              id: true,
              profileUrl: true,
            },
          });
          return {
            ...item,
            room,
            users,
            lastMessage,
          };
        }),
      );

      const output = await this.commonService.paginationOutput(
        input,
        this.userRoomRepository,
        {
          user: {
            id: user.id,
          },
        },
      );
      return {
        rooms: mapRooms,
        ...output,
      };
    } catch (error) {
      return this.commonService.error(error);
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
        return this.commonService.error('채팅 가능한 유저가 없습니다.');

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

      this.pubSub.publish(NEW_ROOM, {
        newRoom: targetUserRoom,
      });

      return {
        ok: true,
        room: myRoom,
      };
    } catch (error) {
      return this.commonService.error(error);
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

      if (!existRoom)
        return this.commonService.error('존재하지 않는 방입니다.');

      await this.userRoomRepository.update(input.id, { ...input });

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async checkValidRoom(roomId: number, userId: number) {
    const existRoom = await this.roomRepository.findOne({
      where: {
        id: roomId,
        userRooms: {
          user: {
            id: userId,
          },
        },
      },
    });
    return Boolean(existRoom);
  }

  async updateNewMesssageInUserRoom(
    roomId: number,
    userId: number,
    message: string,
  ) {
    const room = await this.roomRepository.findOne({
      select: {
        userRooms: {
          id: true,
          newMessage: true,
          user: {
            id: true,
          },
        },
      },
      where: {
        id: roomId,
      },
      relations: {
        userRooms: {
          user: true,
        },
      },
    });

    if (!room) return;

    const targetUserRoom = room.userRooms.filter(
      (item) => item.user.id !== userId,
    );

    targetUserRoom.forEach(async (item) => {
      const newMessageCount = item.newMessage + 1;

      await this.userRoomRepository.update(item.id, {
        newMessage: newMessageCount,
      });
      this.pubSub.publish(UPDATE_NEW_MESSAGE, {
        updateNewMessageInUserRoom: {
          id: item.id,
          newMessage: newMessageCount,
          lastMessage: message,
          userId: item.user.id,
        },
      });
    });
  }

  async resetNewMessageInUserRoom(roomId: number, userId: number) {
    const userRoom = await this.userRoomRepository.findOne({
      where: {
        room: {
          id: roomId,
        },
        user: {
          id: userId,
        },
      },
    });

    if (!userRoom) return;

    await this.userRoomRepository.update(userRoom.id, {
      newMessage: 0,
    });
  }
}
