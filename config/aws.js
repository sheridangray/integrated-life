const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

// Debug credentials (safely)
// console.log("AWS Configuration:", {
//   region: process.env.AWS_REGION,
//   hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
//   hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
//   accessKeyLength: process.env.AWS_ACCESS_KEY_ID?.length,
//   secretKeyLength: process.env.AWS_SECRET_ACCESS_KEY?.length,
//   bucketName: process.env.AWS_BUCKET_NAME,
// });

// Create S3 client with explicit configuration
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
  forcePathStyle: true, // Add this to avoid DNS-style bucket URLs
});

// Upload function
const uploadToS3 = async (file, folder = "recipes") => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials are not properly configured");
  }

  const fileName = `${folder}/${Date.now()}-${file.originalname.replace(
    /\s+/g,
    "-"
  )}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    console.log("Attempting S3 upload with params:", {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
      Region: process.env.AWS_REGION,
    });

    // Use the Upload utility for better handling of large files
    const upload = new Upload({
      client: s3Client,
      params: params,
    });

    const result = await upload.done();
    console.log("Upload result:", result); // Add this for debugging

    // Construct the URL ourselves instead of relying on result.Location
    const url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    console.log("Constructed URL:", url);

    return {
      url: url,
      key: params.Key,
    };
  } catch (error) {
    console.error("S3 upload error details:", {
      code: error.Code || error.code,
      message: error.Message || error.message,
      stack: error.stack,
      name: error.name,
    });
    throw new Error("Failed to upload file to S3");
  }
};

// Delete function
const deleteFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.deleteObject(params);
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error("Failed to delete file from S3");
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
};
