import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'tasheel-uploads'

export async function uploadToS3(
  file: File,
  filename: string
): Promise<{ url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: file.type,
    ACL: 'public-read', // Make file publicly accessible
  })

  await s3Client.send(command)

  // Construct the public URL
  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION || 'ap-southeast-1'}.amazonaws.com/${filename}`

  return { url }
}

export async function deleteFromS3(url: string): Promise<void> {
  // Extract the filename from the URL
  // URL format: https://tasheel-uploads.s3.ap-southeast-1.amazonaws.com/folder/filename.jpg
  const urlParts = url.split('/')
  const filename = urlParts.slice(3).join('/') // Everything after the domain

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
  })

  await s3Client.send(command)
}
