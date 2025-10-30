const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else {
  console.warn(' CLOUDINARY_URL not configured. File uploads will not work.');
}

module.exports = cloudinary;

