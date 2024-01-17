import { Mutation, Resolver } from '@nestjs/graphql';
import { CreateRandomRoomOutput } from './dtos/create-random-room.dto';
import { Private } from 'src/auth/auth.decorator';
import { LoggedInUser } from 'src/user/user.decorator';
import { User } from 'src/user/entites/user.entity';
import { RoomService } from './room.service';

@Resolver()
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}

  @Mutation(() => CreateRandomRoomOutput)
  @Private()
  async createRandomRoom(
    @LoggedInUser() user: User,
  ): Promise<CreateRandomRoomOutput> {
    return this.roomService.createRandomRoom(user);
  }
}
