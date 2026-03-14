import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  public_id: string;
  format: string;
  size: number;
  created_at: string;
}

export async function uploadFile(
  file: File,
  folder: string = 'assignments'
): Promise<UploadResult> {
  // Check file size (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size exceeds 2MB limit');
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        max_file_size: maxSize,
        use_filename: true,
        unique_filename: true,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Upload failed: No result returned'));
          return;
        }

        console.log(result);

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          size: result.bytes || 0,
          created_at: result.created_at || new Date().toISOString(),
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteFile(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error: UploadApiErrorResponse | undefined) => {
      if (error) {
        reject(new Error(`Delete failed: ${error.message}`));
        return;
      }
      resolve();
    });
  });
}
