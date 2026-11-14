import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export class EmailService {
  /**
   * Sends a 6-digit email verification code with branded HTML.
   */
  static async sendVerificationEmail(to: string, name: string, code: string): Promise<boolean> {
    try {
      const client = getTransporter();
      const verifyLink = `${config.FRONTEND_URL}/verify?code=${code}&email=${encodeURIComponent(to)}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
            .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
            .header { background: #0f172a; padding: 28px; text-align: center; border-bottom: 1px solid #334155; }
            .logo { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #10b981; color: #022c22; font-weight: 900; font-size: 22px; border-radius: 12px; margin-bottom: 8px; }
            .brand { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
            .content { padding: 32px 28px; }
            .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
            .text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
            .code-box { background: #0f172a; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
            .code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #34d399; }
            .btn { display: inline-block; background: #10b981; color: #022c22; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; text-align: center; }
            .footer { padding: 20px 28px; background: #0f172a; border-top: 1px solid #334155; text-align: center; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ሚ</div>
              <div class="brand">MIZAN | ሚዛን</div>
            </div>
            <div class="content">
              <div class="greeting">Selam, ${name}! 👋</div>
              <div class="text">
                Thank you for joining Mizan — Ethiopia's modern sales and billing analytics SaaS. Please verify your email address to unlock all platform features.
              </div>
              <div class="code-box">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 6px;">Your Verification Code</div>
                <div class="code">${code}</div>
              </div>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${verifyLink}" class="btn">Verify Account Instantly &rarr;</a>
              </div>
              <div class="text" style="font-size: 12px; color: #64748b;">
                This code is valid for 15 minutes. If you did not create a Mizan account, please safely ignore this email.
              </div>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Mizan SaaS (ሚዛን). Addis Ababa, Ethiopia.<br>
              Zero-Float Santim Accounting & Multi-Channel Billing Engine
            </div>
          </div>
        </body>
        </html>
      `;

      await client.sendMail({
        from: config.SMTP_FROM,
        to,
        subject: `[${code}] Verify your Mizan (ሚዛን) account`,
        text: `Selam ${name}!\n\nYour Mizan verification code is: ${code}\n\nOr click here: ${verifyLink}\n\nValid for 15 minutes.`,
        html,
      });

      logger.info({ to }, 'Email verification message dispatched');
      return true;
    } catch (err: any) {
      logger.error({ err: err.message, to }, 'Failed to dispatch verification email');
      return false;
    }
  }

  /**
   * Sends a welcome email upon successful verification.
   */
  static async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      const client = getTransporter();
      await client.sendMail({
        from: config.SMTP_FROM,
        to,
        subject: `Welcome to Mizan (ሚዛን), ${name}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #34d399;">Welcome to Mizan | ሚዛን</h2>
            <p style="color: #cbd5e1;">Your account is fully verified! You can now:</p>
            <ul style="color: #94a3b8; line-height: 1.8;">
              <li>Stream Telebirr, CBE Birr & Cash sales in real-time</li>
              <li>Generate 15% Ethiopian VAT compliant invoices</li>
              <li>Issue scoped API keys for POS counter integration</li>
            </ul>
            <p><a href="${config.FRONTEND_URL}/login" style="display: inline-block; background: #10b981; color: #022c22; font-weight: bold; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Launch Dashboard &rarr;</a></p>
          </div>
        `,
      });
      return true;
    } catch (err: any) {
      logger.warn({ err: err.message, to }, 'Failed to send welcome email');
      return false;
    }
  }
}
