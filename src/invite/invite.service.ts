import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CommonService } from 'src/common/common.service';
import { UserService } from 'src/user/user.service';
import { RoomService } from 'src/room/room.service';
import { NotificationService } from 'src/notification/notification.service';

import { Invite, InviteStatus } from './entities/invite.entity';
import { User } from 'src/user/entities/user.entity';
import { NotificationType } from 'src/notification/entities/notification.entity';

import {
  InviteTargetsInput,
  InviteTargetsOutput,
} from './dtos/invite-target.dto';

import { shuffleArray } from 'src/user/utils';
import {
  CreateInviteInput,
  CreateInviteOutput,
} from './dtos/create-invite.dto';
import {
  UpdateInviteInput,
  UpdateInviteOutput,
} from './dtos/update-invite.dto';
import { MyInvitesOutput } from './dtos/my-invites.dto';

import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { UPDATE_INVITE_STATUS } from './invite.constants';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    private readonly commonService: CommonService,
    private readonly userService: UserService,
    private readonly roomService: RoomService,
    private readonly notificationService: NotificationService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async inviteTargets(
    input: InviteTargetsInput,
    loginUser: User,
  ): Promise<InviteTargetsOutput> {
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

      // 이미 채팅중인 유저 목록
      const existingChatUserIds = await this.userService.existingChatUserIds(
        user.id,
      );

      const roomIds = await this.roomService.myInviteRoomIds(user.id);

      // 이미 초대된 유저 목록
      const existingInviteUserIds = await this.inviteRepository.find({
        where: {
          room: {
            id: In(roomIds),
          },
          user: {
            id: Not(user.id),
          },
        },
        relations: {
          user: true,
          room: true,
        },
      });

      const blockIds = [
        ...new Set([
          ...existingChatUserIds,
          ...existingInviteUserIds.map((item) => item.user.id),
          ...user.blockUsers.map((item) => item.id),
          ...blockMeUsers.map((item) => item.id),
          user.id,
        ]),
      ];

      // 채팅 가능한 유저 목록
      const userList = await this.userService.findChatEnabledUsers(blockIds);

      if (userList.length === 0)
        return this.commonService.error('채팅 가능한 유저가 없습니다.');

      const targets = shuffleArray(userList).slice(0, input.count);

      return {
        ok: true,
        targets,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async myInvites(user: User): Promise<MyInvitesOutput> {
    try {
      const myInvites = await this.inviteRepository.find({
        select: {
          room: {
            id: true,
          },
          user: {
            id: true,
          },
        },
        where: {
          user: {
            id: user.id,
          },
        },
        relations: {
          room: true,
          user: true,
        },
      });

      const rooms = await this.roomService.findRoomByIds(
        myInvites.map((invite) => invite.room.id),
        {
          relations: {
            invites: {
              user: true,
            },
          },
          order: {
            createdAt: 'DESC',
          },
        },
      );

      const filteredRooms = rooms.filter(
        (room) =>
          room.invites.filter((invite) => {
            return invite.user !== null;
          }).length > 1,
      );

      return {
        ok: true,
        rooms: filteredRooms,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async createInvite(
    input: CreateInviteInput,
    user: User,
  ): Promise<CreateInviteOutput> {
    try {
      const myInvites = await this.inviteRepository.find({
        where: {
          user: {
            id: user.id,
          },
        },
      });

      if (myInvites.length >= 5)
        return this.commonService.error(
          '초대 목록이 가득 찼습니다.\n초대에 응답 후 다시 시도해주세요.',
        );

      const targetUsers = (
        await Promise.all(
          input.targetIds.map(async (targetId) => {
            const targetUser = await this.userService.findUserById(targetId);
            return targetUser;
          }),
        )
      ).filter((targetUser) => targetUser);

      if (targetUsers.length === 0)
        return this.commonService.error('초대할 유저가 없습니다.');

      const invites = [];
      const myInvite = await this.inviteRepository.save({
        status: InviteStatus.ACCEPT,
        user,
      });
      invites.push(myInvite);

      await Promise.all(
        targetUsers.map(async (targetUser) => {
          const invite = await this.inviteRepository.save({
            user: targetUser,
          });
          invites.push(invite);
          this.notificationService.createNotification(
            {
              title: '새로운 채팅에 초대되었습니다.',
              message: `초대에 응답하고 채팅을 시작해보세요!`,
              type: NotificationType.INVITE,
            },
            targetUser,
          );
        }),
      );

      const room = await this.roomService.createRoomByInvite(invites);

      return {
        ok: true,
        room: {
          ...room,
          invites,
        },
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async updateInvite(
    input: UpdateInviteInput,
    user: User,
  ): Promise<UpdateInviteOutput> {
    try {
      if (input.status === InviteStatus.WAIT)
        return this.commonService.error('수락 또는 거절만 할 수 있습니다.');

      const invite = await this.inviteRepository.findOne({
        select: {
          room: {
            id: true,
          },
        },
        where: {
          id: input.id,
        },
        relations: {
          user: true,
          room: true,
        },
      });

      if (!invite) return this.commonService.error('존재하지 않는 초대입니다.');
      if (invite.user.id !== user.id)
        return this.commonService.error('본인의 초대만 수정할 수 있습니다.');

      if (invite.status !== InviteStatus.WAIT)
        return this.commonService.error(
          '응답 대기중인 초대만 수정할 수 있습니다.',
        );

      await this.inviteRepository.update(input.id, {
        status: input.status,
      });

      const anotherInvites = await this.inviteRepository.find({
        where: {
          id: Not(input.id),
          room: {
            id: invite.room.id,
          },
        },
        relations: {
          user: true,
        },
      });

      anotherInvites.forEach((anotherInvite) => {
        this.pubSub.publish(UPDATE_INVITE_STATUS, {
          updateInviteStatus: {
            id: invite.id,
            status: input.status,
            roomId: invite.room.id,
            userId: anotherInvite.user.id,
          },
        });
        this.notificationService.createNotification(
          {
            title: '채팅 초대에 대한 응답이 있습니다.',
            message: `${user.nickname}님이 초대를 ${input.status === InviteStatus.ACCEPT ? '수락' : '거절'}했습니다.`,
            type: NotificationType.INVITE,
          },
          anotherInvite.user,
        );
      });

      const invites = [{ ...invite, status: input.status }, ...anotherInvites];

      const waitInvites = invites.find(
        (invite) => invite.status === InviteStatus.WAIT,
      );

      if (!waitInvites) {
        const acceptInvites = invites.filter(
          (invite) => invite.status === InviteStatus.ACCEPT,
        );
        this.inviteRepository.delete(invites.map((invite) => invite.id));
        if (acceptInvites.length > 1) {
          const myRoom =
            await this.roomService.createUserRoomForAcceptedInvites(
              user.id,
              invite.room.id,
              acceptInvites,
            );

          return {
            ok: true,
            room: myRoom,
          };
        } else {
          this.roomService.deleteRoomOnInvite(invite.room.id);
        }
      }

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async deleteMyInvites(userId: string) {
    const invites = await this.inviteRepository.find({
      select: {
        room: {
          id: true,
        },
      },
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        room: true,
      },
    });

    if (invites.length === 0) return;
    const roomIds = invites.map((invite) => invite.room.id);

    await this.roomService.deleteRoomOnInvites(roomIds);
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'deleteExpiredInvites',
  })
  async deleteExpiredInvites() {
    try {
      const expiredInvites = await this.inviteRepository.find({
        select: {
          room: {
            id: true,
          },
        },
        where: {
          createdAt: LessThan(new Date(Date.now() - 1000 * 60 * 60 * 23)),
        },
        relations: {
          room: true,
        },
      });

      if (expiredInvites.length === 0) return;

      const roomIds = [
        ...new Set(expiredInvites.map((invite) => invite.room.id)),
      ];
      await this.roomService.deleteRoomOnInvites(roomIds);
    } catch (error) {
      console.error('====== deleteExpiredInvites error:', error);
    }
  }
}
