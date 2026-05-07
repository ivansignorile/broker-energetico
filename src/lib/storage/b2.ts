// src/lib/storage/b2.ts
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export function b2Client(): S3Client {
  if (!client) {
    const endpoint = process.env.B2_ENDPOINT;
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY;
    if (!endpoint || !keyId || !appKey) throw new Error("B2 env vars not configured");

    client = new S3Client({
      endpoint,
      region: "auto",
      credentials: { accessKeyId: keyId, secretAccessKey: appKey },
      forcePathStyle: true,
    });
  }
  return client;
}

export async function listB2Objects(prefix?: string): Promise<{ key: string; size: number; lastModified?: Date }[]> {
  const bucket = process.env.B2_BUCKET;
  if (!bucket) throw new Error("B2_BUCKET not set");

  const out: { key: string; size: number; lastModified?: Date }[] = [];
  let continuation: string | undefined;
  do {
    const r = await b2Client().send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuation,
    }));
    for (const obj of r.Contents ?? []) {
      if (obj.Key) out.push({ key: obj.Key, size: obj.Size ?? 0, lastModified: obj.LastModified });
    }
    continuation = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (continuation);
  return out;
}

export async function uploadToB2(key: string, body: Uint8Array | Buffer, contentType = "application/pdf"): Promise<void> {
  const bucket = process.env.B2_BUCKET;
  if (!bucket) throw new Error("B2_BUCKET not set");
  await b2Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}
