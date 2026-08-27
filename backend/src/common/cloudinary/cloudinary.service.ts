import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Thin wrapper around the Cloudinary SDK (config qua .env: CLOUDINARY_CLOUD_NAME/
 * API_KEY/API_SECRET — xem MailService cho cùng pattern lazy-init + graceful
 * no-op nếu thiếu cấu hình). Nhận thẳng base64 data URI (Cloudinary's
 * uploader.upload() chấp nhận data URI trực tiếp, không cần multer/buffer).
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  private ensureConfigured() {
    if (this.configured) return true;
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      this.logger.warn(
        'Thiếu cấu hình Cloudinary (.env) — không thể upload ảnh.',
      );
      return false;
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.configured = true;
    return true;
  }

  /**
   * Uploads a base64 data URI (e.g. `data:image/jpeg;base64,...`) and returns its
   * hosted `secure_url`. Used by customer.service.ts#submitFaceConsent so
   * `Customer.avatar_url` always holds a real URL, never a raw base64 blob.
   */
  async uploadImage(dataUri: string, folder: string): Promise<string> {
    if (!this.ensureConfigured()) {
      throw new BadRequestException(
        'Dịch vụ lưu trữ ảnh chưa được cấu hình, vui lòng thử lại sau',
      );
    }
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
        overwrite: true,
      });
      return result.secure_url;
    } catch (err) {
      this.logger.error('Cloudinary upload thất bại', err as Error);
      throw new BadRequestException('Không thể tải ảnh lên, vui lòng thử lại');
    }
  }
}
