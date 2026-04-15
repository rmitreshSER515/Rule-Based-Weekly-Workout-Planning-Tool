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

  @Prop({ type: [String], default: [] })
  friendIds: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);