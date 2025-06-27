import { Document, Model, Types } from 'mongoose';

declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      role: string;
    }
  }
}

export interface IHackathon extends Document {
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  organizer_id: Types.ObjectId;
  status: 'upcoming' | 'ongoing' | 'ended';
  price: number;
  currency: string;
  discord_link?: string;
  created_at: Date;
  updated_at: Date;
}

declare const Hackathon: Model<IHackathon>;

export default Hackathon;
