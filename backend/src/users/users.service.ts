import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';

type CreateUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
    });

    return {
      id: created._id.toString(),
      email: created.email,
      role: created.role,
      firstName: created.firstName,
      lastName: created.lastName,
      phoneNumber: created.phoneNumber,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
    };
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

    return users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
    }));
  }
}
