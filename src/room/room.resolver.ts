import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { Private } from 'src/auth/auth.decorator';
import { LoggedInUser } from 'src/user/user.decorator';
import { User } from 'src/user/entites/user.entity';
import { RoomService } from './room.service';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/update-room.dto';
import { MyRoomsOutput } from './dtos/my-rooms.dto';

@Resolver()
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}

  @Query(() => MyRoomsOutput)
  @Private()
  async myRooms(@LoggedInUser() user: User): Promise<MyRoomsOutput> {
    return this.roomService.myRooms(user);
  }

  @Mutation(() => CreateRandomRoomOutput)
  @Private()
  async createRandomRoom(
    @LoggedInUser() user: User,
  ): Promise<CreateRandomRoomOutput> {
    return this.roomService.createRandomRoom(user);
  }

  @Mutation(() => UpdateRoomOutput)
  @Private()
  async updateRoom(
    @Args('input') input: UpdateRoomInput,
    @LoggedInUser() user: User,
  ): Promise<UpdateRoomOutput> {
    return this.roomService.updateRoom(input, user);
  }
}
