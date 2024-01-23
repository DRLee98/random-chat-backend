import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { LoggedInUser } from 'src/user/user.decorator';
import { User } from 'src/user/entites/user.entity';
import { RoomService } from './room.service';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/update-room.dto';
import { MyRoomsInput, MyRoomsOutput } from './dtos/my-rooms.dto';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from 'src/common/common.constants';
import { Inject } from '@nestjs/common';
import { UpdateNewMessageInUserRoom } from './dtos/update-new-message.dto';
import { NEW_ROOM, UPDATE_NEW_MESSAGE } from './room.constants';
import { UserRoom } from './entites/user-room.entity';

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

  @Subscription(() => UserRoom, {
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
