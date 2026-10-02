import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'm2it006u',
  api_key: process.env.CLOUDINARY_API_KEY || '298149493337981',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Fi0bWxIu_iHRW40rkQ9P8U7B4z4',
  secure: true
});

export default cloudinary;
