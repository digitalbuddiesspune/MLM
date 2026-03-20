import cloudinary from '../config/cloudinary.js';

/**
 * Uploads a multer memory file to Cloudinary.
 * @param {{ buffer: Buffer, mimetype: string, originalname: string }} file
 * @param {string} folder
 * @returns {Promise<{ secureUrl: string, publicId: string }>}
 */
export function uploadFileToCloudinary(file, folder = 'mlm/kyc') {
  return new Promise((resolve, reject) => {
    if (!file?.buffer) {
      const err = new Error('File buffer is missing');
      err.statusCode = 400;
      reject(err);
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          const err = new Error(error.message || 'Cloudinary upload failed');
          err.statusCode = 500;
          reject(err);
          return;
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
}
