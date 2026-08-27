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

  async sendCustomerAccountCredentialsEmail(
    to: string,
    fullName: string,
    tenantName: string,
    temporaryPassword: string,
  ) {
    const subject = `🎉 Chào mừng ${fullName} - Thông tin tài khoản Hội viên tại ${tenantName}`;
    const loginUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173/login';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tài Khoản Hội Viên FitFlow</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f4f5; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.08); border: 1px solid #e4e4e7;">
                
                <!-- HEADER WITH LUXURY GRADIENT -->
                <tr>
                  <td style="background: linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%); padding: 36px 32px; text-align: center;">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 6px 16px; border-radius: 99px; backdrop-filter: blur(8px); margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
                      <span style="color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">FITFLOW SAAS PLATFORM</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0 0 6px 0; letter-spacing: -0.5px;">${tenantName}</h1>
                    <p style="color: #a7f3d0; font-size: 14px; margin: 0; font-weight: 500;">Thông tin Khởi tạo Tài khoản Hội viên</p>
                  </td>
                </tr>

                <!-- MAIN BODY -->
                <tr>
                  <td style="padding: 36px 32px;">
                    <p style="font-size: 16px; font-weight: 700; color: #18181b; margin: 0 0 12px 0;">Kính gửi ${fullName},</p>
                    <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
                      Chúc mừng bạn đã đăng ký thành công tài khoản Hội viên tại <strong style="color: #047857;">${tenantName}</strong>. Dưới đây là thông tin mật khẩu tạm thời để bạn truy cập và trải nghiệm dịch vụ.
                    </p>

                    <!-- CREDENTIALS CARD -->
                    <div style="background-color: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 18px; padding: 24px; margin-bottom: 24px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="padding-bottom: 14px; border-bottom: 1px border-dash #cbd5e1;">
                            <span style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Email đăng nhập</span>
                            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${to}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 14px;">
                            <span style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Mật khẩu tạm thời</span>
                            <div style="margin-top: 8px;">
                              <span style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 900; color: #047857; letter-spacing: 3px; background: #ffffff; padding: 8px 18px; border-radius: 10px; border: 1.5px dashed #059669; display: inline-block;">${temporaryPassword}</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- SECURITY NOTICE -->
                    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 14px 16px; margin-bottom: 28px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td width="24" valign="top" style="font-size: 16px;">🔒</td>
                          <td style="font-size: 13px; color: #92400e; line-height: 1.5; font-weight: 600; padding-left: 8px;">
                            <strong>Yêu cầu bảo mật:</strong> Để bảo vệ quyền lợi cá nhân, hệ thống bắt buộc bạn <strong>thay đổi mật khẩu riêng mới</strong> ngay ở lần đăng nhập đầu tiên.
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- CTA BUTTON -->
                    <div style="text-align: center; margin-bottom: 28px;">
                      <a href="${loginUrl}" target="_blank" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 36px; border-radius: 14px; display: inline-block; box-shadow: 0 8px 16px -4px rgba(5, 150, 105, 0.35);">
                        Đăng Nhập Ngay &rarr;
                      </a>
                    </div>

                    <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0;">
                      Nếu đường dẫn không hoạt động, truy cập trực tiếp: <a href="${loginUrl}" style="color: #059669; font-weight: 600;">${loginUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #fafafa; padding: 20px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                    <p style="font-size: 12px; font-weight: 600; color: #a1a1aa; margin: 0 0 4px 0;">Hệ thống Quản lý Phòng Gym Cao Cấp FitFlow SaaS</p>
                    <p style="font-size: 11px; color: #d4d4d8; margin: 0;">Email này được gửi tự động. Vui lòng không trả lời trực tiếp email này.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const transporter = this.getTransporter();
    if (!transporter) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[DEV] Email gửi tài khoản Hội viên cho ${to}: mật khẩu ${temporaryPassword}`,
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
        `Gửi email tài khoản Hội viên tới ${to} thất bại: ${(err as Error).message}`,
      );
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[DEV] Email gửi tài khoản Hội viên cho ${to}: mật khẩu ${temporaryPassword}`,
        );
      }
    }
  }

  async sendCustomerPasswordResetEmail(
    to: string,
    fullName: string,
    tenantName: string,
    temporaryPassword: string,
  ) {
    const subject = `🔑 Cấp lại Mật khẩu Tài khoản Hội viên - ${tenantName}`;
    const loginUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173/login';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cấp Lại Mật Khẩu Hội Viên</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f4f5; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.08); border: 1px solid #e4e4e7;">
                
                <!-- HEADER WITH LUXURY GRADIENT -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #047857 100%); padding: 36px 32px; text-align: center;">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 6px 16px; border-radius: 99px; backdrop-filter: blur(8px); margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
                      <span style="color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">SECURITY RECOVERY</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 6px 0; letter-spacing: -0.5px;">${tenantName}</h1>
                    <p style="color: #6ee7b7; font-size: 14px; margin: 0; font-weight: 500;">Thông tin Mật Khẩu Tạm Thời Mới</p>
                  </td>
                </tr>

                <!-- MAIN BODY -->
                <tr>
                  <td style="padding: 36px 32px;">
                    <p style="font-size: 16px; font-weight: 700; color: #18181b; margin: 0 0 12px 0;">Kính gửi ${fullName},</p>
                    <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
                      Yêu cầu cấp lại mật khẩu cho tài khoản Hội viên của bạn tại <strong style="color: #047857;">${tenantName}</strong> đã được xử lý thành công. Dưới đây là mật khẩu tạm thời mới để bạn đăng nhập.
                    </p>

                    <!-- CREDENTIALS CARD -->
                    <div style="background-color: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 18px; padding: 24px; margin-bottom: 24px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="padding-bottom: 14px; border-bottom: 1px border-dash #cbd5e1;">
                            <span style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Email đăng nhập</span>
                            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${to}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 14px;">
                            <span style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Mật khẩu tạm thời mới</span>
                            <div style="margin-top: 8px;">
                              <span style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 900; color: #047857; letter-spacing: 3px; background: #ffffff; padding: 8px 18px; border-radius: 10px; border: 1.5px dashed #059669; display: inline-block;">${temporaryPassword}</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- SECURITY NOTICE -->
                    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 14px 16px; margin-bottom: 28px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td width="24" valign="top" style="font-size: 16px;">🔒</td>
                          <td style="font-size: 13px; color: #92400e; line-height: 1.5; font-weight: 600; padding-left: 8px;">
                            <strong>Yêu cầu bảo mật:</strong> Để đảm bảo an toàn, hệ thống yêu cầu bạn <strong>thay đổi mật khẩu riêng mới</strong> ngay ở lần đăng nhập tiếp theo.
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- CTA BUTTON -->
                    <div style="text-align: center; margin-bottom: 28px;">
                      <a href="${loginUrl}" target="_blank" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 36px; border-radius: 14px; display: inline-block; box-shadow: 0 8px 16px -4px rgba(5, 150, 105, 0.35);">
                        Đăng Nhập Ngay &rarr;
                      </a>
                    </div>

                    <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0;">
                      Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ ngay với Bộ phận Quản lý phòng tập.
                    </p>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #fafafa; padding: 20px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                    <p style="font-size: 12px; font-weight: 600; color: #a1a1aa; margin: 0 0 4px 0;">Hệ thống Quản lý Phòng Gym Cao Cấp FitFlow SaaS</p>
                    <p style="font-size: 11px; color: #d4d4d8; margin: 0;">Email này được gửi tự động. Vui lòng không trả lời trực tiếp email này.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const transporter = this.getTransporter();
    if (!transporter) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[DEV] Email cấp lại mật khẩu Hội viên cho ${to}: mật khẩu ${temporaryPassword}`,
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
        `Gửi email cấp lại mật khẩu Hội viên tới ${to} thất bại: ${(err as Error).message}`,
      );
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[DEV] Email cấp lại mật khẩu Hội viên cho ${to}: mật khẩu ${temporaryPassword}`,
        );
      }
    }
  }
}
