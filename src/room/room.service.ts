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
import { RoomDetailInput, RoomDetailOutput } from './dtos/room-detail.dto';
import { DeleteRoomInput, DeleteRoomOutput } from './dtos/delete-room.dto';
import { MessageType } from 'src/message/entites/message.entity';

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
            updatedAt: true,
          },
        },
        where: {
          user: {
            id: user.id,
          },
        },
        order: {
          pinnedAt: {
            direction: 'DESC',
            nulls: 'LAST',
          },
          room: {
            updatedAt: 'DESC',
          },
        },
        relations: {
          room: true,
          user: false,
        },
        ...this.commonService.paginationOption(input),
      });

      const mapRooms: MyRoomsOutput['rooms'] = (
        await Promise.all(
          rooms.map(async ({ room, ...item }) => {
            const lastMessage = await this.messageService.findLastMessage(
              room.id,
            );
            const users = await this.userService.findUserByRoomId(
              room.id,
              {
                select: {
                  id: true,
                  profileUrl: true,
                },
              },
              [user.id],
            );
            return {
              ...item,
              room,
              users,
              lastMessage,
            };
          }),
        )
      ).sort((a, b) => {
        if (a.pinnedAt && b.pinnedAt) {
          return (
            Math.max(b.pinnedAt.getTime(), b.room.updatedAt.getTime()) -
            Math.max(a.pinnedAt.getTime(), a.room.updatedAt.getTime())
          );
        }
        if (b.pinnedAt && !a.pinnedAt) return 1;
        if (a.pinnedAt && !b.pinnedAt) return -1;
        return 0;
      });

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
        userList[Math.floor(Math.random() * userList.length)].id;
      const targetUser = await this.userService.findUserById(targetUserId);

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
        newRoom: {
          ...targetUserRoom,
          room,
          lastMessage: '',
          users: [targetUser, user],
        },
      });

      return {
        ok: true,
        room: {
          ...myRoom,
          room,
          lastMessage: '',
          users: [targetUser, user],
        },
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async updateRoom(
    { userRoomId, pinned, ...input }: UpdateRoomInput,
    user: User,
  ): Promise<UpdateRoomOutput> {
    try {
      const existRoom = await this.userRoomRepository.findOne({
        where: {
          id: userRoomId,
          user: {
            id: user.id,
          },
        },
      });

      if (!existRoom)
        return this.commonService.error('존재하지 않는 방입니다.');

      await this.userRoomRepository.update(userRoomId, {
        ...input,
        ...(pinned !== undefined && { pinnedAt: pinned ? new Date() : null }),
      });

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async roomDetail(
    input: RoomDetailInput,
    user: User,
  ): Promise<RoomDetailOutput> {
    try {
      const userRoom = await this.userRoomRepository.findOne({
        where: {
          room: {
            id: input.roomId,
          },
          user: {
            id: user.id,
          },
        },
      });

      if (!userRoom) return this.commonService.error('존재하지 않는 방입니다.');

      const users = await this.userService.findUserByRoomId(
        input.roomId,
        {
          select: {
            id: true,
            nickname: true,
            profileUrl: true,
            bio: true,
            language: true,
          },
        },
        [user.id],
      );

      return {
        ok: true,
        room: {
          userRoom,
          users,
        },
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async deleteRoom(
    input: DeleteRoomInput,
    user: User,
  ): Promise<DeleteRoomOutput> {
    try {
      const room = await this.roomRepository.findOne({
        where: {
          id: input.roomId,
        },
      });

      if (!room) return this.commonService.error('존재하지 않는 방입니다.');

      const userRooms = await this.userRoomRepository.find({
        select: {
          user: {
            id: true,
          },
        },
        where: {
          room: {
            id: input.roomId,
          },
        },
        relations: {
          user: true,
        },
      });

      let myUserRoom = null;
      const unDeletedUserRooms = [];

      userRooms.forEach((room) => {
        if (room.user.id === user.id) {
          myUserRoom = room;
        } else {
          unDeletedUserRooms.push(room);
        }
      });

      if (!myUserRoom)
        return this.commonService.error('참여중인 방이 아닙니다.');

      await this.userRoomRepository.softDelete(myUserRoom.id);
      await this.messageService.sendMessage(
        {
          roomId: input.roomId,
          contents: `${user.nickname}님이 채팅방을 나갔습니다.`,
          type: MessageType.SYSTEM,
        },
        user,
      );

      if (unDeletedUserRooms.length === 0) {
        await this.roomRepository.softDelete(input.roomId);
        await this.messageService.deleteMessages(input.roomId);
      }

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async checkValidRoom(roomId: string, userId: string) {
    const existRoom = await this.roomRepository.findOne({
      where: {
        id: roomId,
        userRooms: {
          user: {
            id: userId,
          },
        },
      },
      withDeleted: true,
    });
    return Boolean(existRoom);
  }

  async updateNewMesssageInUserRoom(
    roomId: string,
    userId: string,
    message: string,
  ) {
    const userRooms = await this.userRoomRepository.find({
      select: {
        id: true,
        newMessage: true,
        user: {
          id: true,
        },
        room: {
          id: true,
        },
      },
      where: {
        room: {
          id: roomId,
        },
        user: {
          id: Not(userId),
        },
      },
      relations: {
        user: true,
        room: true,
      },
    });

    if (userRooms.length === 0) return;

    userRooms.forEach(async (item) => {
      const newMessageCount = item.newMessage + 1;

      this.userRoomRepository.update(item.id, {
        newMessage: newMessageCount,
      });
      this.pubSub.publish(UPDATE_NEW_MESSAGE, {
        updateNewMessageInUserRoom: {
          id: item.id,
          newMessage: newMessageCount,
          lastMessage: message,
          userId: item.user.id,
          roomId: item.room.id,
        },
      });
    });
  }

  async resetNewMessageInUserRoom(roomId: string, userId: string) {
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

  async updateRoomUpdateAt(roomId: string) {
    await this.roomRepository.update(roomId, {
      updatedAt: new Date(),
    });
  }
}
