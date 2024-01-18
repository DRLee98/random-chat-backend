import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { LoggedInUser } from 'src/user/user.decorator';
import { User } from 'src/user/entites/user.entity';
import { RoomService } from './room.service';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/update-room.dto';
import { MyRoomsInput, MyRoomsOutput } from './dtos/my-rooms.dto';

@Resolver()
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}

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
}
