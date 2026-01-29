import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: env.R2_UPLOAD_IMAGE_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY!
    }
});

export const uploadImageAssets = async (buffer: Buffer, key: string, contentType: string = 'image/png') => {
    await r2.send(
        new PutObjectCommand({
            Bucket: env.R2_UPLOAD_IMAGE_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read'
        })
    );

    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;
    return publicUrl;
};
