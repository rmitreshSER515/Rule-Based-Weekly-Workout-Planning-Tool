import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';

export type PasswordResetFields = {
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  passwordResetRequestedAt: Date | null;
};

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

  async findDocumentByEmail(email: string): Promise<UserDocument | null> {
    return this.findByEmail(email);
  }

  async setPasswordResetFields(
    email: string,
    fields: PasswordResetFields,
  ): Promise<boolean> {
    const res = await this.userModel.updateOne(
      { email: email.toLowerCase().trim() },
      { $set: fields },
    );
    return res.matchedCount > 0;
  }

  async setPasswordAndClearReset(email: string, passwordHash: string): Promise<boolean> {
    const res = await this.userModel.updateOne(
      { email: email.toLowerCase().trim() },
      {
        $set: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          passwordResetRequestedAt: null,
        },
      },
    );
    return res.matchedCount > 0;
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
}