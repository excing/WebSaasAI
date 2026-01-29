import { uploadImageAssets } from '$lib/server/upload-image';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        // 认证检查：确保用户已登录
        if (!locals.session?.user) {
            return json({ error: 'Unauthorized. Please sign in to upload files.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate MIME type - only allow image files
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];

        if (!allowedMimeTypes.includes(file.type)) {
            return json({ error: 'Invalid file type. Only image files are allowed.' }, { status: 400 });
        }

        // Validate file size - limit to 10MB
        const maxSizeInBytes = 10 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            return json({ error: 'File too large. Maximum size allowed is 10MB.' }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate a unique filename with original extension
        const fileExt = file.name.split('.').pop() || '';
        const timestamp = Date.now();
        const filename = `upload-${timestamp}.${fileExt || 'png'}`;

        // Upload the file
        const url = await uploadImageAssets(buffer, filename, file.type);

        return json({ url });
    } catch (error) {
        console.error('Upload error:', error);
        return json({ error: 'Failed to process upload' }, { status: 500 });
    }
};
