import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class SmsService {
  /**
   * Normalizes Ethiopian phone numbers into E.164 (+251...) or national 09/07 format.
   * Handles Telebirr (09...), Safaricom (07...), and international prefixes.
   */
  static normalizeEthiopianPhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '').trim();

    if (cleaned.startsWith('+251')) {
      return cleaned;
    }
    if (cleaned.startsWith('251')) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
      return `+251${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('9') || cleaned.startsWith('7')) {
      return `+251${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Dispatches an SMS verification OTP via the Afro Message Gateway.
   */
  static async sendOtp(toPhone: string, otpCode: string): Promise<boolean> {
    const normalizedPhone = this.normalizeEthiopianPhone(toPhone);
    const message = `ሚዛን (Mizan) የማረጋገጫ ኮድዎ፡ ${otpCode} ነው። በ10 ደቂቃ ውስጥ ይጠቀሙበት። / Your Mizan verification code is: ${otpCode}. Valid for 10 mins.`;

    try {
      if (!config.SMS_API_KEY) {
        logger.warn({ to: normalizedPhone, otpCode }, 'Afro Message API Key not configured; skipping SMS dispatch');
        return false;
      }

      const res = await fetch(config.SMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.SMS_API_KEY}`,
        },
        body: JSON.stringify({
          to: normalizedPhone,
          message,
          sender: config.SMS_SENDER || undefined,
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      const ok = res.ok && data?.acknowledge !== 'error';

      if (!ok) {
        logger.warn(
          {
            phone: normalizedPhone,
            status: res.status,
            error: data?.response?.errors || data?.message || res.statusText,
          },
          'Afro Message SMS dispatch rejected'
        );
        return false;
      }

      logger.info({ phone: normalizedPhone }, 'Afro Message OTP SMS dispatched successfully');
      return true;
    } catch (err: any) {
      logger.error({ err: err.message, phone: normalizedPhone }, 'Failed to dispatch Afro Message OTP SMS');
      return false;
    }
  }
}
