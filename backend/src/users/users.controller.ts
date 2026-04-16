import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('friends/request')
  async requestFriend(
    @Body() body: { userId: string; email: string },
  ) {
    return this.usersService.sendFriendRequestByEmail(body.userId, body.email);
  }

  @Get(':userId/friends')
  async listFriends(@Param('userId') userId: string) {
    return this.usersService.getFriends(userId);
  }

  @Delete(':userId/friends/:friendId')
  async removeFriend(
    @Param('userId') userId: string,
    @Param('friendId') friendId: string,
  ) {
    return this.usersService.removeFriend(userId, friendId);
  }

  @Get()
  async list(@Query('search') search?: string) {
    return this.usersService.searchUsers(search ?? '');
  }
}
