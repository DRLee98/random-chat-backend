import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';

import { RoomService } from './room.service';

import { User } from 'src/user/entites/user.entity';
import { LoggedInUser } from 'src/user/user.decorator';

import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/update-room.dto';
import { MyRoom, MyRoomsInput, MyRoomsOutput } from './dtos/my-rooms.dto';
import { UpdateNewMessageInUserRoom } from './dtos/update-new-message.dto';
import { RoomDetailInput, RoomDetailOutput } from './dtos/room-detail.dto';
import { DeleteRoomInput, DeleteRoomOutput } from './dtos/delete-room.dto';

import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from 'src/common/common.constants';
import { NEW_ROOM, UPDATE_NEW_MESSAGE } from './room.constants';

@Resolver()
export class RoomResolver {
  constructor(
    private readonly roomService: RoomService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => MyRoomsOutput)
  async myRooms(
    @Args('input') input: MyRoomsInput,
    @LoggedInUser() user: User,
  ): Promise<MyRoomsOutput> {
    return this.roomService.myRooms(input, user);
  }

  @Mutation(() => CreateRandomRoomOutput)
  async createRandomRoom(
    @LoggedInUser() user: User,
  ): Promise<CreateRandomRoomOutput> {
    return this.roomService.createRandomRoom(user);
  }

  @Mutation(() => UpdateRoomOutput)
  async updateRoom(
    @Args('input') input: UpdateRoomInput,
    @LoggedInUser() user: User,
  ): Promise<UpdateRoomOutput> {
    return this.roomService.updateRoom(input, user);
  }

  @Query(() => RoomDetailOutput)
  async roomDetail(
    @Args('input') input: RoomDetailInput,
    @LoggedInUser() user: User,
  ): Promise<RoomDetailOutput> {
    return this.roomService.roomDetail(input, user);
  }

  @Mutation(() => DeleteRoomOutput)
  async deleteRoom(
    @Args('input') input: DeleteRoomInput,
    @LoggedInUser() user: User,
  ): Promise<DeleteRoomOutput> {
    return this.roomService.deleteRoom(input, user);
  }

  @Subscription(() => MyRoom, {
    filter: (payload, _, context) => {
      return payload.newRoom.user.id === context.user.id;
    },
    resolve(payload) {
      return payload.newRoom;
    },
  })
  newRoom() {
    return this.pubSub.asyncIterator(NEW_ROOM);
  }

  @Subscription(() => UpdateNewMessageInUserRoom, {
    filter: (payload, _, context) => {
      return payload.updateNewMessageInUserRoom.userId === context.user.id;
    },
    resolve(payload) {
      return payload.updateNewMessageInUserRoom;
    },
  })
  updateNewMessageInUserRoom() {
    return this.pubSub.asyncIterator(UPDATE_NEW_MESSAGE);
  }
}
