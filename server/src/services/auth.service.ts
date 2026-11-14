import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { config } from '../config/index.js';
import { UserModel, UserDocument } from '../models/User.js';
import { OrganizationModel } from '../models/Organization.js';
import { MembershipModel } from '../models/Membership.js';
import { RefreshTokenModel } from '../models/RefreshToken.js';
import { SubscriptionModel } from '../models/Subscription.js';
import { DataSourceModel } from '../models/DataSource.js';
import { DashboardModel } from '../models/Dashboard.js';
import { TRIAL_DURATION_DAYS } from '@mizan/shared';
import { sha256 } from '../utils/crypto.js';
import { UnauthorizedError, ConflictError, NotFoundError, BadRequestError } from '../utils/errors.js';
import { EmailService } from './email.service.js';
import { SmsService } from './sms.service.js';
import { logger } from '../utils/logger.js';

const BCRYPT_SALT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Registers a new user, creates their primary organization, default data source,
   * 14-day Business trial subscription, and default dashboard.
   */
  static async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    orgName?: string;
  }): Promise<{ user: UserDocument; tokens: AuthTokens; orgId: string }> {
    const existing = await UserModel.findOne({ email: data.email });
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const emailExpires = new Date(Date.now() + 15 * 60 * 1000);

    let phoneNormalized: string | undefined;
    let phoneCode: string | undefined;
    let phoneExpires: Date | undefined;

    if (data.phone) {
      phoneNormalized = SmsService.normalizeEthiopianPhone(data.phone);
      phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
      phoneExpires = new Date(Date.now() + 10 * 60 * 1000);
    }

    const user = await UserModel.create({
      name: data.name,
      email: data.email,
      phone: phoneNormalized,
      passwordHash,
      platformRole: 'user',
      isEmailVerified: false,
      isPhoneVerified: false,
      emailVerificationCode: emailCode,
      emailVerificationExpires: emailExpires,
      phoneVerificationCode: phoneCode,
      phoneVerificationExpires: phoneExpires,
    });

    // Asynchronously dispatch verification email and SMS
    EmailService.sendVerificationEmail(user.email, user.name, emailCode).catch((err) =>
      logger.warn({ err: err.message }, 'Initial verification email failed to dispatch')
    );
    if (phoneNormalized && phoneCode) {
      SmsService.sendOtp(phoneNormalized, phoneCode).catch((err) =>
        logger.warn({ err: err.message }, 'Initial verification SMS failed to dispatch')
      );
    }

    // Generate unique slug
    const orgName = data.orgName || `${data.name}'s Shop`;
    const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
    const slug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;

    const org = await OrganizationModel.create({
      name: orgName,
      slug,
      status: 'active',
      vatRegistered: true,
      fiscalYearStartDay: 8,
      fiscalYearStartMonth: 7,
      timezone: 'Africa/Addis_Ababa',
      preferredLanguage: 'en',
    });

    // Create Membership as Owner (unscoped because initial setup)
    await MembershipModel.create({
      orgId: org._id,
      userId: user._id,
      role: 'owner',
    });

    // Create 14-Day Business Trial Subscription
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    await SubscriptionModel.create({
      orgId: org._id,
      planId: 'business',
      planVersion: 1,
      status: 'trialing',
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    });

    // Create Default Data Source: "Main Store"
    const source = await DataSourceModel.create({
      orgId: org._id,
      name: 'Main Store',
      type: 'pos',
      description: 'Default primary sales point',
    });

    // Create Default Dashboard
    await DashboardModel.create({
      orgId: org._id,
      name: 'Sales Overview',
      description: 'Main revenue, order volume, and channel analytics',
      isDefault: true,
      widgets: [
        { id: 'w1', type: 'stat_tile', title: 'Total Revenue', metric: 'revenue', gridPos: { x: 0, y: 0, w: 3, h: 2 } },
        { id: 'w2', type: 'stat_tile', title: 'Orders', metric: 'orders', gridPos: { x: 3, y: 0, w: 3, h: 2 } },
        { id: 'w3', type: 'stat_tile', title: 'Units Sold', metric: 'units', gridPos: { x: 6, y: 0, w: 3, h: 2 } },
        { id: 'w4', type: 'stat_tile', title: 'Expenses', metric: 'expenses', gridPos: { x: 9, y: 0, w: 3, h: 2 } },
        { id: 'w5', type: 'line_chart', title: 'Revenue Trend', metric: 'revenue', granularity: 'day', gridPos: { x: 0, y: 2, w: 8, h: 4 } },
        { id: 'w6', type: 'channel_breakdown', title: 'Channel Mix', metric: 'revenue', gridPos: { x: 8, y: 2, w: 4, h: 4 } },
      ],
    });

    const tokens = await this.generateTokens(user._id.toString(), user.platformRole);

    return { user, tokens, orgId: org._id.toString() };
  }

  /**
   * Log in user. Returns identical error for wrong password or non-existent user.
   */
  static async login(
    email: string,
    password: string,
    totpCode?: string
  ): Promise<{ user: UserDocument; tokens: AuthTokens; mfaRequired?: boolean }> {
    const user = await UserModel.findOne({ email }).select('+passwordHash +mfaSecret');

    // Constant-time protection: Always hash if user not found
    if (!user || !user.passwordHash) {
      await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // MFA Verification if enabled
    if (user.mfaEnabled) {
      if (!totpCode) {
        return { user, tokens: { accessToken: '', refreshToken: '' }, mfaRequired: true };
      }
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret!,
        encoding: 'base32',
        token: totpCode,
        window: 1,
      });
      if (!verified) {
        throw new UnauthorizedError('Invalid multi-factor authentication code');
      }
    }

    const tokens = await this.generateTokens(user._id.toString(), user.platformRole);
    return { user, tokens };
  }

  /**
   * Generates Access Token and Rotated Refresh Token.
   */
  static async generateTokens(userId: string, role: string, familyId?: string): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { sub: userId, role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const tokenHash = sha256(refreshTokenPlain);
    const family = familyId || crypto.randomUUID();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshTokenModel.create({
      userId,
      tokenHash,
      familyId: family,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
    };
  }

  /**
   * Rotates refresh token; detects reuse and revokes entire family.
   */
  static async refreshTokens(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = sha256(rawRefreshToken);
    const existing = await RefreshTokenModel.findOne({ tokenHash });

    if (!existing) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reuse detection: If an already-used token is presented, compromise is suspected!
    if (existing.isUsed) {
      // Revoke all tokens in family
      await RefreshTokenModel.deleteMany({ familyId: existing.familyId });
      throw new UnauthorizedError('Refresh token reuse detected. All sessions revoked.');
    }

    // Mark current token as used
    existing.isUsed = true;
    await existing.save();

    const user = await UserModel.findById(existing.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return this.generateTokens(user._id.toString(), user.platformRole, existing.familyId);
  }

  /**
   * Initiates TOTP MFA setup.
   */
  static async setupMfa(userId: string): Promise<{ secret: string; qrCodeDataUrl: string }> {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const secret = speakeasy.generateSecret({
      name: `Mizan (${user.email})`,
      issuer: 'Mizan Analytics',
    });

    user.mfaSecret = secret.base32;
    await user.save();

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCodeDataUrl,
    };
  }

  /**
   * Verifies and enables TOTP MFA.
   */
  static async verifyAndEnableMfa(userId: string, token: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select('+mfaSecret');
    if (!user || !user.mfaSecret) {
      throw new UnauthorizedError('MFA setup not initialized');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedError('Invalid TOTP verification code');
    }

    user.mfaEnabled = true;
    await user.save();
    return true;
  }

  /**
   * Generates a new 6-digit email verification code and sends it via EmailService.
   */
  static async sendEmailVerification(userId: string): Promise<boolean> {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.isEmailVerified) return true;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.emailVerificationCode = code;
    user.emailVerificationExpires = expires;
    await user.save();

    return EmailService.sendVerificationEmail(user.email, user.name, code);
  }

  /**
   * Verifies the user's email using the provided 6-digit code.
   */
  static async verifyEmail(userId: string, code: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select('+emailVerificationCode +emailVerificationExpires');
    if (!user) throw new NotFoundError('User not found');
    if (user.isEmailVerified) return true;

    if (!user.emailVerificationCode || user.emailVerificationCode !== code.trim()) {
      throw new BadRequestError('Invalid email verification code');
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires.getTime() < Date.now()) {
      throw new BadRequestError('Email verification code has expired. Please request a new code.');
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    EmailService.sendWelcomeEmail(user.email, user.name).catch((err) =>
      logger.warn({ err: err.message }, 'Failed to dispatch welcome email')
    );

    return true;
  }

  /**
   * Dispatches an SMS OTP via Afro Message.
   */
  static async sendPhoneOtp(userId: string, phone: string): Promise<boolean> {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const normalized = SmsService.normalizeEthiopianPhone(phone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.phone = normalized;
    user.phoneVerificationCode = code;
    user.phoneVerificationExpires = expires;
    await user.save();

    return SmsService.sendOtp(normalized, code);
  }

  /**
   * Verifies the 6-digit SMS OTP from Afro Message.
   */
  static async verifyPhoneOtp(userId: string, phone: string, code: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select('+phoneVerificationCode +phoneVerificationExpires');
    if (!user) throw new NotFoundError('User not found');

    const normalized = SmsService.normalizeEthiopianPhone(phone);
    if (!user.phoneVerificationCode || user.phoneVerificationCode !== code.trim()) {
      throw new BadRequestError('Invalid SMS OTP verification code');
    }

    if (user.phoneVerificationExpires && user.phoneVerificationExpires.getTime() < Date.now()) {
      throw new BadRequestError('SMS OTP verification code has expired. Please request a new code.');
    }

    user.phone = normalized;
    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    return true;
  }
}
