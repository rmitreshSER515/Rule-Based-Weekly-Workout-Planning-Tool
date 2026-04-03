import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ default: 'user' })
  role: string;

  /** SHA-256 hash of the raw reset token (never store the raw token). */
  @Prop({ type: String, default: null })
  passwordResetTokenHash: string | null;

  @Prop({ type: Date, default: null })
  passwordResetExpiresAt: Date | null;

  /** Last time a forgot-password email was issued; used for per-user cooldown (e.g. 30 min). */
  @Prop({ type: Date, default: null })
  passwordResetRequestedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);