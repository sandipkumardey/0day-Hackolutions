import mongoose, { Document, Schema, model, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

type JwtPayload = {
  id: string;
};

// Type assertion for JWT sign options to handle expiresIn type
type JwtSignOptions = SignOptions & {
  [key: string]: any; // Allow any additional properties
};

export interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch?: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
}

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'user' | 'admin' | 'organizer';
  avatar?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  isEmailVerified: boolean;
  bankDetails?: IBankDetails[];
  defaultBankAccount?: string; // Reference to bankDetails _id
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  taxInfo?: {
    pan?: string;
    gstin?: string;
  };
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  getResetPasswordToken(): string;
  getEmailVerificationToken(): string;
  addBankAccount(accountDetails: Omit<IBankDetails, 'isVerified' | 'verifiedAt'>): Promise<IBankDetails>;
  getPrimaryBankAccount(): IBankDetails | undefined;
  verifyBankAccount(accountId: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin', 'organizer'], default: 'user' },
  avatar: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  emailVerificationToken: { type: String },
  emailVerificationExpire: { type: Date },
  isEmailVerified: { type: Boolean, default: false },
  bankDetails: [{ type: Schema.Types.ObjectId, ref: 'BankDetails' }],
  defaultBankAccount: { type: Schema.Types.ObjectId, ref: 'BankDetails' },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
  },
  taxInfo: {
    pan: { type: String },
    gstin: { type: String },
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function (): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  // Using type assertion to bypass the expiresIn type check
  const options = { expiresIn } as unknown as JwtSignOptions;
  return jwt.sign({ id: this._id }, secret, options);
};

UserSchema.methods.getResetPasswordToken = function (): string {
  const secret = process.env.RESET_PASSWORD_TOKEN;
  if (!secret) {
    throw new Error('RESET_PASSWORD_TOKEN is not defined in environment variables');
  }
  const expiresIn = process.env.RESET_PASSWORD_EXPIRE || '1h';
  // Using type assertion to bypass the expiresIn type check
  const options = { expiresIn } as unknown as SignOptions;
  
  const resetToken = jwt.sign({ id: this._id }, secret, options);

  this.resetPasswordToken = resetToken;
  this.resetPasswordExpire = new Date(Date.now() + (parseInt(expiresIn) * 1000 || 3600000));

  return resetToken;
};

UserSchema.methods.getEmailVerificationToken = function (): string {
  const secret = process.env.EMAIL_VERIFICATION_TOKEN;
  if (!secret) {
    throw new Error('EMAIL_VERIFICATION_TOKEN is not defined in environment variables');
  }
  const expiresIn = process.env.EMAIL_VERIFICATION_EXPIRE || '1d';
  // Using type assertion to bypass the expiresIn type check
  const options = { expiresIn } as unknown as SignOptions;
  
  const verificationToken = jwt.sign({ id: this._id }, secret, options);

  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpire = new Date(Date.now() + (parseInt(expiresIn) * 1000 || 86400000));

  return verificationToken;
};

UserSchema.methods.addBankAccount = async function (accountDetails: Omit<IBankDetails, 'isVerified' | 'verifiedAt'>) {
  const BankDetails = model('BankDetails');
  const bankAccount = new BankDetails({ ...accountDetails, isPrimary: false, isVerified: false });
  await bankAccount.save();
  this.bankDetails.push(bankAccount._id);
  await this.save();
  return bankAccount;
};

UserSchema.methods.getPrimaryBankAccount = function (): IBankDetails | undefined {
  if (this.bankDetails && this.bankDetails.length > 0) {
    // We'll need to populate bankDetails before calling this method
    return (this.bankDetails as unknown as IBankDetails[]).find((account: IBankDetails) => account.isPrimary);
  }
  return undefined;
};

UserSchema.methods.verifyBankAccount = async function (accountId: string) {
  const BankDetails = model('BankDetails');
  const bankAccount = await BankDetails.findById(accountId);
  if (bankAccount) {
    bankAccount.isVerified = true;
    bankAccount.verifiedAt = Date.now();
    await bankAccount.save();
    return true;
  }
  return false;
};

const User = model<IUser>('User', UserSchema);

export default User;
