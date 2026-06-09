import {v2 as cloudinary} from 'cloudinary'
import {CloudinaryStorage} from 'multer-storage-cloudinary'
import multer from 'multer';

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET,
    secure:true
})

const ALLOWED_TYPES=['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const SIZE_LIMITS = {
  avatar:    2 * 1024 * 1024,
  clubCover: 5 * 1024 * 1024,
}

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type "${file.mimetype}". Only JPEG, PNG, and WebP are accepted.`), false)
  }
}

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    folder:        'bookfolio/avatars',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
})

const clubCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    folder:        'bookfolio/clubs',
    transformation: [{ width: 1200, height: 600, crop: 'fill', gravity: 'auto' }],
  },
})

const createUploadMiddleware = (storageInstance, sizeLimit) => multer({
  storage: storageInstance,
  fileFilter,
  limits: { fileSize: sizeLimit },
})

export const uploadAvatar    = createUploadMiddleware(avatarStorage, SIZE_LIMITS.avatar)
export const uploadClubCover = createUploadMiddleware(clubCoverStorage, SIZE_LIMITS.clubCover)

export const deleteImage = async (publicId) => {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate:    true,
    })
  } catch (err) {
    console.error(`[Cloudinary] Could not delete "${publicId}":`, err.message)
  }
}

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large.' })
    }
    return res.status(400).json({ error: err.message })
  }

  if (err?.message?.includes('Invalid file type')) {
    return res.status(415).json({ error: err.message })
  }

  if (err?.http_code) {
    return res.status(502).json({ error: 'Image service error. Please try again.' })
  }

  next(err)
}

export { cloudinary }
