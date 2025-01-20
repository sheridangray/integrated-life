const multer = require("multer");
const path = require("path");

// Change to memory storage for S3 uploads
const storage = multer.memoryStorage();

// Configure file filter with better debugging
const fileFilter = (req, file, cb) => {
  //  console.log("Uploading file:", file.originalname);
  //  console.log("Mimetype:", file.mimetype);

  // Accept images based on mimetype
  if (!file.mimetype.startsWith("image/")) {
    console.log("File rejected: not an image type");
    return cb(new Error("Only image files are allowed!"), false);
  }

  // Additional check for file extension
  const filetypes = /jpeg|jpg|png|gif|webp/i;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (!extname) {
    console.log("File rejected: invalid extension");
    return cb(
      new Error("Only .png, .jpg, .jpeg, .gif, and .webp files are allowed!"),
      false
    );
  }

  console.log("File accepted");
  cb(null, true);
};

// Export the configured multer middleware
exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
