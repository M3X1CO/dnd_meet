import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageToCloudinary(base64Image: string, folder: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 900, height: 450, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  try {
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/').split('.')[0];
    
    console.log('Deleting image with public_id:', publicIdWithFolder);
    
    const result = await cloudinary.uploader.destroy(publicIdWithFolder);
    
    if (result.result !== 'ok' && result.result !== 'not found') {
      console.error('Failed to delete image from Cloudinary:', result);
    } else {
      console.log('Successfully deleted image from Cloudinary');
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

export { cloudinary };
