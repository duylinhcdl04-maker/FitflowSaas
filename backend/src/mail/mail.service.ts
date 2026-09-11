import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailLayoutOptions {
  title: string;
  badgeText: string;
  badgeBg?: string;
  heading: string;
  subheading?: string;
  greeting?: string;
  mainMessageHtml: string;
  actionBoxHtml?: string;
  quoteText?: string;
  quoteAuthor?: string;
  securityNoticeHtml?: string;
  ctaButton?: {
    text: string;
    url: string;
  };
  footerNote?: string;
}

/**
 * MailService phụ trách gửi toàn bộ transactional emails cho FitFlow:
 * - OTP đăng ký, quên mật khẩu, đổi mật khẩu
 * - Cấp tài khoản nhân sự / quản lý / hội viên
 * - Mời tham gia hệ thống
 *
 * Tối ưu hóa UI/UX email theo chuẩn Luxury Fitness Branding:
 * - Tương thích hoàn hảo với Gmail, Apple Mail, Outlook, Mobile app
 * - Bố cục thẻ nổi (Card), gradient emerald hiện đại, logo & typography sắc nét
 * - Tích hợp thông điệp truyền cảm hứng (Motivational Quotes) và lưu ý bảo mật chuẩn quốc tế
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private isPort465 = false;

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

    const host = process.env.SMTP_HOST;
    let port = Number(process.env.SMTP_PORT);
    let secure = process.env.SMTP_SECURE === 'true';

    // Gmail trên cloud (Railway, AWS, VPS) ưu tiên cổng 465 (direct SSL) vì cổng 587 hay bị firewall/proxy chặn hoặc timeout
    if (host.includes('gmail.com')) {
      if (port === 465 || !port || process.env.SMTP_SECURE === 'true') {
        port = 465;
        secure = true;
        this.isPort465 = true;
      }
    } else if (!port) {
      port = 587;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });
    return this.transporter;
  }

  /**
   * Phương thức gửi email an toàn, hỗ trợ tự động fallback sang cổng 465 (SSL)
   * nếu cổng 587 (STARTTLS) bị nhà mạng / hạ tầng cloud (Railway, AWS) chặn.
   */
  private async deliverEmail(
    to: string,
    subject: string,
    html: string,
    devCodeFallback?: string,
  ): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      if (process.env.NODE_ENV !== 'production' && devCodeFallback) {
        this.logger.warn(`[DEV] Mã OTP cho ${to}: ${devCodeFallback}`);
      }
      return false;
    }

    const rawFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
    const from =
      rawFrom && rawFrom.includes('@')
        ? rawFrom
        : `"FitFlow" <${process.env.SMTP_USER}>`;

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`[EMAIL SUCCESS] Đã gửi thư tới ${to} | ${subject}`);
      return true;
    } catch (err) {
      const errorMsg = (err as Error).message;
      this.logger.error(`[EMAIL ERROR] Gửi thư tới ${to} thất bại: ${errorMsg}`);

      // Nếu chạy trên Gmail và đang dùng port 587 bị timeout/chặn kết nối, tự động chuyển sang port 465 SSL
      const host = process.env.SMTP_HOST || '';
      if (host.includes('gmail.com') && !this.isPort465) {
        this.logger.warn(
          `[EMAIL] Đang thử lại gửi qua Gmail port 465 (Direct SSL)...`,
        );
        try {
          const fallbackTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 12000,
          });

          await fallbackTransporter.sendMail({
            from,
            to,
            subject,
            html,
          });

          this.logger.log(
            `[EMAIL SUCCESS] Gửi thành công qua cổng 465 SSL tới ${to}!`,
          );
          // Ghi nhớ transporter 465 cho các lần gửi tiếp theo
          this.transporter = fallbackTransporter;
          this.isPort465 = true;
          return true;
        } catch (fallbackErr) {
          this.logger.error(
            `[EMAIL ERROR] Thử lại cổng 465 cũng thất bại: ${(fallbackErr as Error).message}`,
          );
        }
      }

      if (process.env.NODE_ENV !== 'production' && devCodeFallback) {
        this.logger.warn(`[DEV] Mã OTP cho ${to}: ${devCodeFallback}`);
      }
      return false;
    }
  }

  /**
   * Bộ tạo HTML Email Template chuẩn mực cho toàn bộ hệ thống
   */
  private buildMasterEmailHtml(options: EmailLayoutOptions): string {
    const {
      title,
      badgeText,
      badgeBg = 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      heading,
      subheading,
      greeting,
      mainMessageHtml,
      actionBoxHtml,
      quoteText,
      quoteAuthor = 'FitFlow Wellness Team',
      securityNoticeHtml,
      ctaButton,
      footerNote,
    } = options;

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, h1, h2, p, a, span { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #1e293b;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f1f5f9; padding: 40px 12px;">
    <tr>
      <td align="center">
        <!-- EMAIL CARD WRAPPER -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px -12px rgba(15, 23, 42, 0.12); border: 1px solid #e2e8f0;">
          
          <!-- HEADER WITH BRAND LOGO & GRADIENT -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #065f46 45%, #059669 100%); padding: 40px 32px 36px 32px; text-align: center;">
              
              <!-- LOGO EMBLEM -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td align="center" style="background: rgba(255, 255, 255, 0.16); border: 1.5px solid rgba(255, 255, 255, 0.3); border-radius: 16px; padding: 12px 18px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size: 24px; line-height: 1; padding-right: 10px;">⚡</td>
                        <td style="font-size: 22px; font-weight: 900; letter-spacing: 2.5px; color: #ffffff; text-transform: uppercase;">
                          FITFLOW
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- BADGE -->
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.28); padding: 5px 14px; border-radius: 9999px; margin-bottom: 12px;">
                <span style="color: #ecfdf5; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">${badgeText}</span>
              </div>

              <!-- HEADING -->
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.4px; line-height: 1.3;">${heading}</h1>
              ${subheading ? `<p style="color: #a7f3d0; font-size: 14px; margin: 0; font-weight: 500;">${subheading}</p>` : ''}
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding: 36px 32px 32px 32px; background-color: #ffffff;">
              
              <!-- GREETING -->
              ${greeting ? `<p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0;">${greeting}</p>` : ''}

              <!-- MAIN MESSAGE -->
              <div style="font-size: 14px; color: #475569; line-height: 1.7; margin: 0 0 24px 0;">
                ${mainMessageHtml}
              </div>

              <!-- ACTION BOX (OTP / CREDENTIALS) -->
              ${actionBoxHtml ? `
                <div style="margin: 24px 0;">
                  ${actionBoxHtml}
                </div>
              ` : ''}

              <!-- CTA BUTTON IF PROVIDED -->
              ${ctaButton ? `
                <div style="text-align: center; margin: 30px 0 24px 0;">
                  <a href="${ctaButton.url}" target="_blank" style="background: ${badgeBg}; color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 12px; display: inline-block; box-shadow: 0 8px 20px -4px rgba(5, 150, 105, 0.4); letter-spacing: 0.3px;">
                    ${ctaButton.text} &rarr;
                  </a>
                </div>
              ` : ''}

              <!-- SECURITY NOTICE -->
              ${securityNoticeHtml ? `
                <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 14px 16px; margin: 24px 0;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td width="24" valign="top" style="font-size: 16px; line-height: 1.4;">🔒</td>
                      <td style="font-size: 13px; color: #92400e; line-height: 1.5; font-weight: 500; padding-left: 10px;">
                        ${securityNoticeHtml}
                      </td>
                    </tr>
                  </table>
                </div>
              ` : ''}

              <!-- MOTIVATIONAL QUOTE CARD -->
              ${quoteText ? `
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%); border: 1px dashed #86efac; border-radius: 14px; padding: 16px 20px; margin: 26px 0 10px 0; text-align: center;">
                  <p style="font-size: 13px; font-style: italic; color: #166534; line-height: 1.6; margin: 0 0 6px 0;">
                    &ldquo;${quoteText}&rdquo;
                  </p>
                  <p style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
                    &mdash; ${quoteAuthor}
                  </p>
                </div>
              ` : ''}

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 12px; font-weight: 700; color: #334155; margin: 0 0 4px 0;">
                FitFlow &bull; Nền Tảng Quản Lý & Tối Ưu Hóa Phòng Gym & Fitness
              </p>
              <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0 0 8px 0;">
                ${footerNote || 'Email này được gửi tự động từ hệ thống bảo mật FitFlow. Quý khách vui lòng không phản hồi trực tiếp vào địa chỉ này.'}
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                &copy; ${new Date().getFullYear()} FitFlow SaaS. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  async sendOtpEmail(to: string, code: string, purpose: string) {
    let subject = 'Mã xác thực FitFlow';
    let heading = 'Xác thực tài khoản';
    let subheading = 'Mã OTP bảo mật của bạn';
    let badgeText = 'BẢO MẬT FITFLOW';
    let mainMsg = 'Chúng tôi nhận được yêu cầu xác thực từ bạn. Vui lòng sử dụng mã OTP dưới đây để hoàn tất thao tác:';
    let quote = 'Kỷ luật hôm nay là vóc dáng và sức khỏe của ngày mai. Hãy bắt đầu ngay!';

    if (purpose === 'REGISTER_VERIFY') {
      subject = '✨ Chào mừng bạn đến với FitFlow - Mã kích hoạt tài khoản';
      heading = 'Chào Mừng Đến Với FitFlow!';
      subheading = 'Kích hoạt tài khoản và khởi đầu hành trình mới';
      badgeText = 'ĐĂNG KÝ TÀI KHOẢN';
      mainMsg = `
        Cảm ơn bạn đã lựa chọn <strong>FitFlow</strong> làm người bạn đồng hành trên con đường rèn luyện và bứt phá thể lực.<br/>
        Để hoàn tất thủ tục đăng ký và kích hoạt tài khoản, vui lòng nhập mã xác thực OTP 6 số dưới đây:
      `;
      quote = 'Hành trình vạn dặm bắt đầu từ một bước chân. Chúc bạn có những trải nghiệm tuyệt vời cùng FitFlow!';
    } else if (purpose === 'FORGOT_PASSWORD') {
      subject = '🔐 Yêu cầu khôi phục mật khẩu tài khoản FitFlow';
      heading = 'Khôi Phục Mật Khẩu';
      subheading = 'Bảo vệ quyền truy cập và dữ liệu luyện tập của bạn';
      badgeText = 'KHÔI PHỤC MẬT KHẨU';
      mainMsg = `
        Chúng tôi đã tiếp nhận yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email <strong>${to}</strong>.<br/>
        Đừng lo lắng, hãy sử dụng mã OTP bên dưới để tiến hành tạo mật khẩu mới an toàn:
      `;
      quote = 'Đừng để bất kỳ gián đoạn nào làm chậm bước tiến đến mục tiêu thể hình của bạn. Bứt phá ngay hôm nay!';
    } else if (purpose === 'CHANGE_PASSWORD') {
      subject = '🛡️ Xác nhận đổi mật khẩu tài khoản FitFlow';
      heading = 'Xác Nhận Đổi Mật Khẩu';
      subheading = 'Đảm bảo tính an toàn tối đa cho tài khoản của bạn';
      badgeText = 'BẢO MẬT TÀI KHOẢN';
      mainMsg = `
        Bạn đang thực hiện thao tác cập nhật mật khẩu mới cho tài khoản FitFlow. Nhập mã OTP sau để xác nhận quyền sở hữu:
      `;
      quote = 'An toàn và bảo mật thông tin là nền tảng vững chắc cho mọi thành công.';
    }

    const actionBoxHtml = `
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 2px solid #a7f3d0; border-radius: 16px; padding: 24px; text-align: center;">
        <div style="font-size: 12px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">
          MÃ XÁC THỰC OTP CỦA BẠN
        </div>
        <div style="display: inline-block; background: #ffffff; border: 2px dashed #059669; border-radius: 12px; padding: 12px 28px; box-shadow: 0 4px 12px -2px rgba(5, 150, 105, 0.15);">
          <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #065f46; vertical-align: middle;">
            ${code}
          </span>
        </div>
        <div style="margin-top: 14px; font-size: 13px; font-weight: 600; color: #047857;">
          ⏱️ Mã có hiệu lực trong vòng <span style="color: #dc2626; font-weight: 800;">5 phút</span>
        </div>
      </div>
    `;

    const securityNoticeHtml = `
      <strong>Lưu ý bảo mật quan trọng:</strong> Tuyệt đối <strong>không chia sẻ</strong> mã OTP này cho bất kỳ ai, bao gồm cả nhân viên hỗ trợ FitFlow. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email và đổi lại mật khẩu nếu cần.
    `;

    const html = this.buildMasterEmailHtml({
      title: subject,
      badgeText,
      heading,
      subheading,
      greeting: `Xin chào Quý khách,`,
      mainMessageHtml: mainMsg,
      actionBoxHtml,
      quoteText: quote,
      securityNoticeHtml,
    });

    await this.deliverEmail(to, subject, html, code);
  }

  /** OW-04b — BR-INVITE-01: nhân sự tự đặt mật khẩu qua link, Owner không đặt hộ. */
  async sendInvitationEmail(
    to: string,
    fullName: string,
    tenantName: string,
    acceptUrl: string,
  ) {
    const subject = `📩 ${tenantName} mời bạn tham gia hệ thống quản lý FitFlow`;
    
    const mainMsg = `
      Bạn đã được đại diện quản lý từ <strong>${tenantName}</strong> gửi lời mời tham gia làm việc và quản trị chi nhánh trên nền tảng <strong>FitFlow SaaS</strong>.<br/>
      Vui lòng nhấn nút bên dưới để kích hoạt tài khoản và thiết lập mật khẩu cá nhân của riêng bạn.
    `;

    const html = this.buildMasterEmailHtml({
      title: subject,
      badgeText: 'LỜI MỜI THAM GIA',
      heading: 'Thư Mời Nhận Việc & Quản Trị',
      subheading: `${tenantName} &bull; FitFlow Platform`,
      greeting: `Kính gửi ${fullName},`,
      mainMessageHtml: mainMsg,
      ctaButton: {
        text: 'Chấp Nhận Lời Mời & Kích Hoạt',
        url: acceptUrl,
      },
      quoteText: 'Sự chuyên nghiệp và nỗ lực của từng cá nhân tạo nên sức mạnh vững chắc của toàn đội ngũ.',
      quoteAuthor: 'FitFlow Team Collaboration',
      securityNoticeHtml: `
        Liên kết xác thực này có hiệu lực trong vòng <strong>7 ngày</strong>. Nếu bạn không mong đợi email này, hãy bỏ qua hoặc liên hệ người quản lý của bạn.
      `,
    });

    await this.deliverEmail(to, subject, html, acceptUrl);
  }

  /**
   * Quản lý chi nhánh (owner/branch-managers) — Owner tạo tài khoản trực tiếp
   */
  async sendAccountCredentialsEmail(
    to: string,
    fullName: string,
    tenantName: string,
    temporaryPassword: string,
  ) {
    const subject = `🏢 Tài khoản Quản lý chi nhánh của bạn tại ${tenantName}`;
    const loginUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173/login';

    const actionBoxHtml = `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 12px; border-bottom: 1px dashed #cbd5e1;">
              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Tài khoản đăng nhập:</span>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${to}</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 12px;">
              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Mật khẩu tạm thời:</span>
              <div style="margin-top: 6px;">
                <span style="font-family: monospace; font-size: 20px; font-weight: 800; color: #047857; letter-spacing: 2px; background: #ffffff; padding: 6px 14px; border-radius: 8px; border: 1.5px dashed #059669; display: inline-block;">${temporaryPassword}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const html = this.buildMasterEmailHtml({
      title: subject,
      badgeText: 'TÀI KHOẢN QUẢN LÝ',
      heading: 'Thông Tin Tài Khoản Chi Nhánh',
      subheading: `${tenantName} &bull; FitFlow Management`,
      greeting: `Xin chào ${fullName},`,
      mainMessageHtml: `
        Chủ cơ sở <strong>${tenantName}</strong> đã khởi tạo thành công tài khoản <strong>Quản lý chi nhánh</strong> cho bạn trên hệ thống FitFlow.<br/>
        Dưới đây là thông tin đăng nhập ban đầu:
      `,
      actionBoxHtml,
      ctaButton: {
        text: 'Đăng Nhập Vào Hệ Thống',
        url: loginUrl,
      },
      quoteText: 'Lãnh đạo xuất sắc là truyền cảm hứng và dẫn dắt tập thể cùng vươn tới đỉnh cao.',
      quoteAuthor: 'FitFlow Leadership',
      securityNoticeHtml: `
        <strong>Quy định bảo mật:</strong> Vui lòng đổi lại mật khẩu cá nhân ngay trong lần đăng nhập đầu tiên để đảm bảo an toàn tuyệt đối.
      `,
    });

    await this.deliverEmail(to, subject, html, temporaryPassword);
  }

  async sendStaffAccountCredentialsEmail(
    to: string,
    fullName: string,
    tenantName: string,
    roleTitle: string,
    temporaryPassword: string,
  ) {
    const subject = `🏋️ Tài khoản ${roleTitle} của bạn tại ${tenantName}`;
    const loginUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173/login';

    const actionBoxHtml = `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 12px; border-bottom: 1px dashed #cbd5e1;">
              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Email đăng nhập:</span>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${to}</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 12px;">
              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Mật khẩu tạm thời:</span>
              <div style="margin-top: 6px;">
                <span style="font-family: monospace; font-size: 20px; font-weight: 800; color: #047857; letter-spacing: 2px; background: #ffffff; padding: 6px 14px; border-radius: 8px; border: 1.5px dashed #059669; display: inline-block;">${temporaryPassword}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const html = this.buildMasterEmailHtml({
      title: subject,
      badgeText: `TÀI KHOẢN ${roleTitle.toUpperCase()}`,
      heading: `Chào Mừng Gia Nhập Đội Ngũ!`,
      subheading: `${tenantName} &bull; FitFlow Operations`,
      greeting: `Xin chào ${fullName},`,
      mainMessageHtml: `
        <strong>${tenantName}</strong> đã cấp cho bạn tài khoản nhân sự với vai trò <strong>${roleTitle}</strong> trên nền tảng FitFlow.<br/>
        Dưới đây là thông tin đăng nhập tạm thời của bạn:
      `,
      actionBoxHtml,
      ctaButton: {
        text: 'Đăng Nhập Vào Ca Làm Việc',
        url: loginUrl,
      },
      quoteText: 'Mỗi nụ cười và sự tận tâm của bạn là nguồn động lực to lớn cho các học viên.',
      quoteAuthor: 'FitFlow Operational Spirit',
      securityNoticeHtml: `
        Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên. Nếu có bất kỳ thắc mắc nào, hãy liên hệ với Quản lý chi nhánh của bạn.
      `,
    });

    await this.deliverEmail(to, subject, html, temporaryPassword);
  }

  async sendCustomerAccountCredentialsEmail(
    to: string,
    fullName: string,
    tenantName: string,
    temporaryPassword: string,
  ) {
    const subject = `🎉 Chào mừng ${fullName} - Thông tin tài khoản Hội viên tại ${tenantName}`;
    const loginUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173/login';

    const actionBoxHtml = `
      <div style="background-color: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 16px; padding: 22px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 12px; border-bottom: 1px dashed #cbd5e1;">
              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Email đăng nhập Hội viên</span>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${to}</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 14px;">
              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Mật khẩu tạm thời khởi tạo</span>
              <div style="margin-top: 8px;">
                <span style="font-family: monospace; font-size: 22px; font-weight: 900; color: #047857; letter-spacing: 3px; background: #ffffff; padding: 8px 18px; border-radius: 10px; border: 1.5px dashed #059669; display: inline-block;">${temporaryPassword}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const html = this.buildMasterEmailHtml({
      title: subject,
      badgeText: 'HỘI VIÊN MỚI',
      heading: `Chào Mừng Đến Với ${tenantName}!`,
      subheading: 'Hành trình bứt phá thể lực và phong cách sống',
      greeting: `Kính gửi ${fullName},`,
      mainMessageHtml: `
        Chúc mừng bạn đã chính thức trở thành Hội viên của <strong style="color: #047857;">${tenantName}</strong>.<br/>
        Tài khoản của bạn đã được thiết lập để đặt lịch tập, theo dõi điểm danh, lịch sử gói tập và nhận các ưu đãi đặc quyền. Dưới đây là thông tin đăng nhập:
      `,
      actionBoxHtml,
      ctaButton: {
        text: 'Đăng Nhập Khám Phá Ngay',
        url: loginUrl,
      },
      quoteText: 'Cơ thể là ngôi đền duy nhất bạn sẽ sống suốt đời. Hãy chăm sóc và rèn luyện nó mỗi ngày!',
      quoteAuthor: 'FitFlow Member Community',
      securityNoticeHtml: `
        <strong>Yêu cầu an toàn:</strong> Để bảo vệ quyền lợi và thông tin thẻ hội viên, vui lòng <strong>thay đổi mật khẩu riêng</strong> ở lần đăng nhập đầu tiên.
      `,
    });

    await this.deliverEmail(to, subject, html, temporaryPassword);
  }

  async sendCustomerPasswordResetEmail(
    to: string,
    fullName: string,
    tenantName: string,
    temporaryPassword: string,
  ) {
    const subject = `🔑 Cấp lại Mật khẩu Tài khoản Hội viên - ${tenantName}`;
    const loginUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173/login';

    const actionBoxHtml = `
      <div style="background-color: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 16px; padding: 22px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 12px; border-bottom: 1px dashed #cbd5e1;">
              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Tài khoản</span>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${to}</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 14px;">
              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Mật khẩu tạm thời mới</span>
              <div style="margin-top: 8px;">
                <span style="font-family: monospace; font-size: 22px; font-weight: 900; color: #047857; letter-spacing: 3px; background: #ffffff; padding: 8px 18px; border-radius: 10px; border: 1.5px dashed #059669; display: inline-block;">${temporaryPassword}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const html = this.buildMasterEmailHtml({
      title: subject,
      badgeText: 'CẤP LẠI MẬT KHẨU',
      heading: 'Khôi Phục Mật Khẩu Hội Viên',
      subheading: `${tenantName} &bull; FitFlow Customer Support`,
      greeting: `Kính gửi ${fullName},`,
      mainMessageHtml: `
        Yêu cầu cấp lại mật khẩu cho tài khoản Hội viên của bạn tại <strong>${tenantName}</strong> đã được xử lý thành công.<br/>
        Dưới đây là mật khẩu tạm thời mới để bạn đăng nhập:
      `,
      actionBoxHtml,
      ctaButton: {
        text: 'Đăng Nhập Và Đổi Mật Khẩu',
        url: loginUrl,
      },
      quoteText: 'Kiên trì không phải là không bao giờ vấp ngã, mà là luôn sẵn sàng đứng dậy và tiếp tục bước đi.',
      quoteAuthor: 'FitFlow Motivation',
      securityNoticeHtml: `
        Vì lý do an toàn, vui lòng <strong>đổi sang mật khẩu cá nhân mới</strong> ngay sau khi đăng nhập. Nếu bạn không gửi yêu cầu này, vui lòng báo ngay cho Quản lý phòng gym.
      `,
    });

    await this.deliverEmail(to, subject, html, temporaryPassword);
  }
}

