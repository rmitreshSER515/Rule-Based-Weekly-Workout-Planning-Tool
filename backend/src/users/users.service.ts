import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import {
  Notification,
  NotificationDocument,
} from '../notifications/entities/notification.schema';

type CreateUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  private toSummary(user: UserDocument) {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
    };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async createUser(input: CreateUserInput) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) return null;

    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await this.userModel.create({
      email: normalizedEmail,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      role: 'user',
      friendIds: [],
    });

    return this.toSummary(created);
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    return this.toSummary(user);
  }

  async searchUsers(query: string) {
    const normalized = query.trim().toLowerCase();
    const filter =
      normalized.length === 0
        ? {}
        : {
            $or: [
              { firstName: { $regex: normalized, $options: 'i' } },
              { lastName: { $regex: normalized, $options: 'i' } },
              { email: { $regex: normalized, $options: 'i' } },
            ],
          };

    const users = await this.userModel
      .find(filter)
      .sort({ firstName: 1, lastName: 1 })
      .limit(50)
      .exec();

    return users.map((user) => this.toSummary(user));
  }

  async getFriends(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const friendIds = user.friendIds ?? [];
    if (friendIds.length === 0) {
      return [];
    }

    const friends = await this.userModel
      .find({ _id: { $in: friendIds } })
      .sort({ firstName: 1, lastName: 1 })
      .exec();

    return friends.map((friend) => this.toSummary(friend));
  }

  async removeFriend(userId: string, friendId: string) {
    const user = await this.userModel.findById(userId).exec();
    const friend = await this.userModel.findById(friendId).exec();

    if (!user || !friend) {
      throw new NotFoundException('User not found');
    }

    if (!(user.friendIds ?? []).includes(friendId)) {
      throw new BadRequestException('This user is not in your friends list');
    }

    await this.userModel
      .updateOne({ _id: user._id }, { $pull: { friendIds: friendId } })
      .exec();

    await this.userModel
      .updateOne({ _id: friend._id }, { $pull: { friendIds: userId } })
      .exec();

    const friendName = `${friend.firstName} ${friend.lastName}`.trim() || friend.email;

    return {
      message: `Removed "${friendName}" from your friends`,
      friendId,
    };
  }

  async sendFriendRequestByEmail(userId: string, email: string) {
    const sender = await this.userModel.findById(userId).exec();
    if (!sender) {
      throw new NotFoundException('User not found');
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    const recipient = await this.findByEmail(normalizedEmail);
    if (!recipient) {
      throw new NotFoundException('No user found with that email address');
    }

    const senderId = sender._id.toString();
    const recipientId = recipient._id.toString();
    const recipientName =
      `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.email;

    if (senderId === recipientId) {
      throw new BadRequestException('You cannot add yourself as a friend');
    }

    if ((sender.friendIds ?? []).includes(recipientId)) {
      throw new BadRequestException('This user is already your friend');
    }

    const existingPending = await this.notificationModel
      .findOne({
        type: 'friend_request',
        status: 'pending',
        $or: [
          { fromUserId: senderId, userId: recipientId },
          { fromUserId: recipientId, userId: senderId },
        ],
      })
      .exec();

    if (existingPending) {
      throw new BadRequestException(
        'A friend request is already pending between you and this user',
      );
    }

    const created = await this.notificationModel.create({
      userId: recipientId,
      fromUserId: senderId,
      message: `${sender.firstName} ${sender.lastName} sent you a friend request.`,
      status: 'pending',
      type: 'friend_request',
    });

    return {
      id: created._id.toString(),
      userId: created.userId,
      fromUserId: created.fromUserId,
      message: `Request sent to "${recipientName}"`,
      status: created.status,
      type: created.type,
      email: recipient.email,
      createdAt: created.get('createdAt'),
      updatedAt: created.get('updatedAt'),
    };
  }
}
