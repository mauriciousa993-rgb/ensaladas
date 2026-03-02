import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
}

export async function POST() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || 'ensaladas';

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { success: false, error: 'Cloudinary no configurado en servidor' },
      { status: 500 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams({ folder, timestamp: String(timestamp) }, apiSecret);

  return NextResponse.json({
    success: true,
    data: {
      cloudName,
      apiKey,
      folder,
      timestamp,
      signature,
    },
  });
}
