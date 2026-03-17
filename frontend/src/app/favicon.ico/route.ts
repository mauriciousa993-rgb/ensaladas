const ICON_BASE64 =
  'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABKoxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/SqMW/0qjFv9Koxb/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

export async function GET() {
  const bytes = Buffer.from(ICON_BASE64, 'base64');

  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

