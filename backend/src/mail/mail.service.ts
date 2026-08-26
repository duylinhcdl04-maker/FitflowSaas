import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Thin wrapper around nodemailer/SMTP (config qua .env: SMTP_HOST/PORT/
 * SECURE/USER/PASSWORD/FROM). Nếu thiếu cấu hình, chỉ log cảnh báo và bỏ qua
 * gửi thật — để môi trường không có SMTP (CI, máy dev khác) không crash toàn
 * bộ luồng đăng ký, nhưng không bao giờ trả OTP qua API nữa (đã có mail
 * service thật thì không còn lý do làm vậy).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASSWORD
    ) {
      this.logger.warn(
        'Thiếu cấu hình SMTP (.env) — bỏ qua gửi email, chỉ ghi log.',
      );
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    return this.transporter;
  }

  async sendOtpEmail(to: string, code: string, purpose: string) {
    let subject = 'Mã xác thực FitFlow';
    let messageText = 'Mã xác thực của bạn là:';

    if (purpose === 'REGISTER_VERIFY') {
      subject = 'Mã xác thực tài khoản FitFlow';
      messageText = 'Mã xác thực tài khoản của bạn là:';
    } else if (purpose === 'FORGOT_PASSWORD') {
      subject = 'Mã xác thực khôi phục mật khẩu FitFlow';
      messageText = 'Mã xác thực để khôi phục mật khẩu của bạn là:';
    } else if (purpose === 'CHANGE_PASSWORD') {
      subject = 'Mã xác thực đổi mật khẩu FitFlow';
      messageText = 'Mã xác thực để đổi mật khẩu của bạn là:';
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #047857;">FitFlow</h2>
        <p>${messageText}</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">${code}</p>
        <p style="color: #6b7280; font-size: 13px;">Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    if (!transporter) {
      // Không có SMTP — dev vẫn cần thấy mã ở đâu đó để test được luồng.
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[DEV] OTP cho ${to} (${purpose}): ${code}`);
      }
      return;
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(
        `Gửi email OTP tới ${to} thất bại: ${(err as Error).message}`,
      );
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[DEV] OTP cho ${to} (${purpose}): ${code}`);
      }
      // Không throw: một lỗi gửi mail không nên chặn hẳn luồng đăng ký — Owner
      // vẫn có thể bấm "Gửi lại mã" để thử lại.
    }
  }

  /** OW-04b — BR-INVITE-01: nhân sự tự đặt mật khẩu qua link, Owner không đặt hộ. */
  async sendInvitationEmail(
    to: string,
    fullName: string,
    tenantName: string,
    acceptUrl: string,
  ) {
    const subject = `${tenantName} mời bạn tham gia FitFlow`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #047857;">FitFlow</h2>
        <p>Xin chào ${fullName},</p>
        <p><strong>${tenantName}</strong> đã mời bạn tham gia quản lý trên FitFlow.</p>
        <p style="margin: 24px 0;">
          <a href="${acceptUrl}" style="background:#047857;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">
            Chấp nhận lời mời
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">Liên kết có hiệu lực trong 7 ngày. Nếu bạn không mong đợi email này, hãy bỏ qua.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    if (!transporter) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[DEV] Invitation link cho ${to}: ${acceptUrl}`);
      }
      return;
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(
        `Gửi email mời tới ${to} thất bại: ${(err as Error).message}`,
      );
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[DEV] Invitation link cho ${to}: ${acceptUrl}`);
      }
    }
  }

  /**
   * Quản lý chi nhánh (owner/branch-managers) — Owner tạo tài khoản trực tiếp,
   * hệ thống tự random mật khẩu và kích hoạt luôn (không qua accept-invite),
   * nên mật khẩu chỉ tồn tại trong email này — không bao giờ trả qua API.
   */
  async sendAccountCredentialsEmail(
    to: string,
    fullName: string,
    tenantName: string,
    temporaryPassword: string,
  ) {
    const subject = `Tài khoản Quản lý chi nhánh của bạn tại ${tenantName}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #047857;">FitFlow</h2>
        <p>Xin chào ${fullName},</p>
        <p><strong>${tenantName}</strong> đã tạo cho bạn một tài khoản Quản lý chi nhánh trên FitFlow.</p>
        <p style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 12px;">
          Tài khoản: <strong>${to}</strong><br/>
          Mật khẩu: <strong style="letter-spacing: 1px;">${temporaryPassword}</strong>
        </p>
        <p style="color: #6b7280; font-size: 13px;">Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên. Nếu bạn không mong đợi email này, hãy bỏ qua.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    if (!transporter) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[DEV] Tài khoản cho ${to}: mật khẩu ${temporaryPassword}`,
        );
      }
      return;
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(
        `Gửi email tài khoản tới ${to} thất bại: ${(err as Error).message}`,
      );
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[DEV] Tài khoản cho ${to}: mật khẩu ${temporaryPassword}`,
        );
      }
    }
  }

  async sendStaffAccountCredentialsEmail(
    to: string,
    fullName: string,
    tenantName: string,
    roleTitle: string,
    temporaryPassword: string,
  ) {
    const subject = `Tài khoản ${roleTitle} của bạn tại ${tenantName}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; background: #ffffff;">
        <h2 style="color: #047857; margin-top: 0;">FitFlow</h2>
        <p style="font-size: 15px; color: #111827;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="color: #374151; font-size: 14px;"><strong>${tenantName}</strong> đã cấp cho bạn tài khoản <strong>${roleTitle}</strong> trên hệ thống FitFlow.</p>
        <div style="margin: 20px 0; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: left;">
          <p style="margin: 4px 0; font-size: 14px; color: #166534;">Email đăng nhập: <strong>${to}</strong></p>
          <p style="margin: 4px 0; font-size: 14px; color: #166534;">Mật khẩu tạm thời: <strong style="letter-spacing: 1px; font-family: monospace; font-size: 16px;">${temporaryPassword}</strong></p>
        </div>
        <p style="color: #4b5563; font-size: 13px;">Vui lòng truy cập hệ thống và đổi lại mật khẩu cá nhân ngay trong lần đăng nhập đầu tiên.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với Quản lý chi nhánh của bạn.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    if (!transporter) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[DEV] Email gửi tài khoản ${roleTitle} cho ${to}: mật khẩu ${temporaryPassword}`,
        );
      }
      return;
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(
        `Gửi email tài khoản ${roleTitle} tới ${to} thất bại: ${(err as Error).message}`,
      );
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[DEV] Email gửi tài khoản ${roleTitle} cho ${to}: mật khẩu ${temporaryPassword}`,
        );
      }
    }
  }
}
