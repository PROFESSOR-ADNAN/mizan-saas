import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import {
  RegisterSchema,
  LoginSchema,
  MfaVerifySchema,
  VerifyEmailSchema,
  SendPhoneOtpSchema,
  VerifyPhoneOtpSchema,
} from '@mizan/shared';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { UserModel } from '../models/User.js';

const router = Router();

router.post('/register', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const result = await AuthService.register(data);

    res.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        platformRole: result.user.platformRole,
      },
      accessToken: result.tokens.accessToken,
      orgId: result.orgId,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = LoginSchema.parse(req.body);
    const result = await AuthService.login(data.email, data.password, data.totpCode);

    if (result.mfaRequired) {
      res.status(200).json({ mfaRequired: true });
      return;
    }

    res.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        platformRole: result.user.platformRole,
      },
      accessToken: result.tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }

    const tokens = await AuthService.refreshTokens(refreshToken);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refresh_token');
  res.status(200).json({ message: 'Logged out successfully' });
});

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        platformRole: user.platformRole,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/email/send-verification', requireAuth, authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sent = await AuthService.sendEmailVerification(req.user!.userId);
    res.status(200).json({ success: true, sent, message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
});

router.post('/email/verify', requireAuth, authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = VerifyEmailSchema.parse(req.body);
    await AuthService.verifyEmail(req.user!.userId, code);
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/phone/send-otp', requireAuth, authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = SendPhoneOtpSchema.parse(req.body);
    const sent = await AuthService.sendPhoneOtp(req.user!.userId, phone);
    res.status(200).json({ success: true, sent, message: 'SMS verification OTP dispatched via Afro Message' });
  } catch (err) {
    next(err);
  }
});

router.post('/phone/verify-otp', requireAuth, authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code } = VerifyPhoneOtpSchema.parse(req.body);
    await AuthService.verifyPhoneOtp(req.user!.userId, phone, code);
    res.status(200).json({ success: true, message: 'Phone verified successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/mfa/setup', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.setupMfa(req.user!.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/mfa/verify', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = MfaVerifySchema.parse(req.body);
    await AuthService.verifyAndEnableMfa(req.user!.userId, data.token);
    res.status(200).json({ success: true, message: 'MFA enabled successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
