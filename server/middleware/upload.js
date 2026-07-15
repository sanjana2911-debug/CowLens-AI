const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use absolute path relative to this file: server/uploads/
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure the uploads directory exists synchronously at module load time
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();
  const allowedTypes = /jpeg|jpg|png|gif|webp/;

  const extname = allowedTypes.test(ext.replace('.', ''));
  const mimetypeOk = allowedTypes.test(mimetype);

  console.log(`[Upload] File received — name: "${file.originalname}", mimetype: "${file.mimetype}", ext: "${ext}", size: ${file.size || 'unknown'} bytes`);

  if (extname && mimetypeOk) {
    console.log(`[Upload] File accepted — extension "${ext}" matches, mimetype "${file.mimetype}" matches.`);
    cb(null, true);
  } else {
    const reason = [];
    if (!extname) reason.push(`extension "${ext}" not in allowed set (jpeg, jpg, png, gif, webp)`);
    if (!mimetypeOk) reason.push(`mimetype "${file.mimetype}" not in allowed set (jpeg, jpg, png, gif, webp)`);
    console.log(`[Upload] File REJECTED — ${reason.join('; ')}`);
    cb(new Error(`Only images are allowed. Reason: ${reason.join('; ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;