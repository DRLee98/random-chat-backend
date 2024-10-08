import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, In, Not, Repository } from 'typeorm';

import { UserService } from 'src/user/user.service';
import { MessageService } from 'src/message/message.service';
import { NotificationService } from 'src/notification/notification.service';
import { CommonService } from 'src/common/common.service';

import { Room } from './entities/room.entity';
import { UserRoom } from './entities/user-room.entity';
import { User } from 'src/user/entities/user.entity';
import { NotificationType } from 'src/notification/entities/notification.entity';
import { Invite } from 'src/invite/entities/invite.entity';

import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/update-room.dto';
import { MyRoom, MyRoomsInput, MyRoomsOutput } from './dtos/my-rooms.dto';
import { RoomDetailInput, RoomDetailOutput } from './dtos/room-detail.dto';
import { DeleteRoomInput, DeleteRoomOutput } from './dtos/delete-room.dto';

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
    private readonly notificationService: NotificationService,
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
            const lastMessage =
              (await this.messageService.findLastMessage(room.id))?.contents ??
              '';
            const users = await this.userService.findUserByRoomId(
              room.id,
              {
                select: {
                  id: true,
                  nickname: true,
                  profileUrl: true,
                  profileBgColor: true,
                  profileTextColor: true,
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
      });

      const targetUserRoom = this.userRoomRepository.create({
        user: targetUser,
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
          users: [user],
        },
      });

      this.notificationService.createNotification(
        {
          title: '새로운 채팅이 생성되었습니다.',
          message: `${user.nickname}님과 채팅을 시작해보세요!`,
          type: NotificationType.ROOM,
          data: {
            roomId: room.id,
          },
        },
        targetUser,
      );

      return {
        ok: true,
        room: {
          ...myRoom,
          room,
          lastMessage: '',
          users: [targetUser],
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
            profileBgColor: true,
            profileTextColor: true,
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

      this.userRoomRepository.softDelete(myUserRoom.id);
      this.messageService.createSystemMessage(
        input.roomId,
        `${user.nickname}님이 채팅방을 나갔습니다.`,
        user,
      );

      if (unDeletedUserRooms.length <= 1) {
        this.roomRepository.softDelete(input.roomId);
        this.messageService.deleteMessages(input.roomId);
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

      await this.userRoomRepository.update(item.id, {
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

  async notiAllowRoomIds(roomId: string, userId: string) {
    const userRoom = await this.userRoomRepository.find({
      where: {
        room: {
          id: roomId,
        },
        user: {
          id: Not(userId),
        },
        noti: true,
      },
    });

    return userRoom.map((item) => item.id);
  }

  async createRoomByInvite(invites: Invite[]) {
    const room = this.roomRepository.create({
      invites: invites,
    });

    await this.roomRepository.save(room);

    return room;
  }

  async createUserRoomForAcceptedInvites(
    userId: string,
    roomId: string,
    acceptInvites: Invite[],
  ) {
    const room = await this.roomRepository.findOne({
      where: {
        id: roomId,
      },
    });

    if (!room) return;
    this.updateRoomUpdateAt(room.id);

    let myUserRoom: MyRoom = null;
    await Promise.all(
      acceptInvites.map(async (invite) => {
        const userRoom = await this.userRoomRepository.save({
          user: invite.user,
          room: room,
        });

        const users = acceptInvites
          .filter((item) => item.id !== invite.id)
          .map((item) => item.user);

        if (invite.user.id === userId) {
          myUserRoom = {
            ...userRoom,
            users,
            lastMessage: '',
          };
        } else {
          this.notificationService.createNotification(
            {
              title: '새로운 채팅이 생성되었습니다.',
              message: `채팅을 시작해보세요!`,
              type: NotificationType.ROOM,
              data: {
                roomId: room.id,
              },
            },
            invite.user,
          );
        }

        this.pubSub.publish(NEW_ROOM, {
          newRoom: {
            ...userRoom,
            room,
            lastMessage: '',
            users,
          },
        });
      }),
    );

    return myUserRoom;
  }

  async deleteRoomOnInvite(roomId: string) {
    await this.roomRepository.delete(roomId);
  }

  async deleteRoomOnInvites(roomIds: string[]) {
    await this.roomRepository.delete(roomIds);
  }

  async myInviteRoomIds(userId: string) {
    const rooms = await this.roomRepository.find({
      select: {
        id: true,
      },
      where: {
        invites: {
          user: {
            id: userId,
          },
        },
      },
    });

    return rooms.map((item) => item.id);
  }

  async findRoomByIds(
    ids: string[],
    options?: Omit<FindOneOptions<Room>, 'where'>,
  ): Promise<Room[]> {
    const room = await this.roomRepository.find({
      ...options,
      where: { id: In(ids) },
    });
    return room;
  }
}
