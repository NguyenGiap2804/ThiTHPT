import path from "path";
import { query } from "../lib/database.js";
import { buildStoredFilename, saveUploadedFile } from "../lib/storage.js";

type LegacyAsset = {
  source: "ExamImages" | "UploadedFiles";
  id: string;
  url: string;
  originalName?: string | null;
};

type BackfillResult = {
  converted: Array<{ source: string; id: string; oldUrl: string; newUrl: string }>;
  missing: Array<{ source: string; id: string; url: string; status?: number; reason: string }>;
};

const sourceBaseUrl = (process.env.BACKFILL_SOURCE_BASE_URL || "https://thithpt-backend.onrender.com")
  .replace(/\/+$/, "");

const toSourceUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  return `${sourceBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

const getLegacyAssets = async (): Promise<LegacyAsset[]> => {
  const examImages = await query<LegacyAsset>(`
    SELECT 'ExamImages' as source, id, "imageUrl" as url, NULL as "originalName"
    FROM "ExamImages"
    WHERE "imageUrl" LIKE '/uploads/%' OR "imageUrl" LIKE $1
    ORDER BY "examId", "pageNumber"
  `, [`${sourceBaseUrl}/uploads/%`]);

  const uploadedFiles = await query<LegacyAsset>(`
    SELECT 'UploadedFiles' as source, id, url, "originalName"
    FROM "UploadedFiles"
    WHERE url LIKE '/uploads/%' OR url LIKE $1
    ORDER BY "createdAt"
  `, [`${sourceBaseUrl}/uploads/%`]);

  return [...examImages, ...uploadedFiles];
};

const inferOriginalName = (asset: LegacyAsset) => {
  if (asset.originalName) return asset.originalName;
  try {
    return path.basename(new URL(toSourceUrl(asset.url)).pathname) || `${asset.id}.bin`;
  } catch {
    return `${asset.id}.bin`;
  }
};

const updateAssetUrl = async (asset: LegacyAsset, stored: Awaited<ReturnType<typeof saveUploadedFile>>) => {
  if (asset.source === "ExamImages") {
    await query(`UPDATE "ExamImages" SET "imageUrl" = $1 WHERE id = $2`, [stored.url, asset.id]);
    return;
  }

  await query(
    `
    UPDATE "UploadedFiles"
    SET url = $1, "storageProvider" = $2, "objectKey" = $3
    WHERE id = $4
    `,
    [stored.url, stored.storageProvider, stored.objectKey ?? null, asset.id]
  );
};

const main = async () => {
  process.env.UPLOAD_STORAGE = "supabase";

  const assets = await getLegacyAssets();
  const result: BackfillResult = { converted: [], missing: [] };

  console.log(`Found ${assets.length} legacy upload URL(s).`);

  for (const asset of assets) {
    const sourceUrl = toSourceUrl(asset.url);

    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        result.missing.push({
          source: asset.source,
          id: asset.id,
          url: asset.url,
          status: response.status,
          reason: `Source URL returned ${response.status}`,
        });
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const originalName = inferOriginalName(asset);
      const filename = buildStoredFilename(originalName);
      const mimetype = response.headers.get("content-type") || "application/octet-stream";
      const stored = await saveUploadedFile({
        originalname: originalName,
        buffer,
        mimetype,
        size: buffer.byteLength,
      } as Express.Multer.File, filename);

      await updateAssetUrl(asset, stored);
      result.converted.push({
        source: asset.source,
        id: asset.id,
        oldUrl: asset.url,
        newUrl: stored.url,
      });
      console.log(`OK ${asset.source}:${asset.id} -> ${stored.url}`);
    } catch (error) {
      result.missing.push({
        source: asset.source,
        id: asset.id,
        url: asset.url,
        reason: error instanceof Error ? error.message : String(error),
      });
      console.warn(`MISS ${asset.source}:${asset.id} ${asset.url}`, error);
    }
  }

  console.log(JSON.stringify({
    converted: result.converted.length,
    missing: result.missing.length,
    missingItems: result.missing,
  }, null, 2));
};

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
