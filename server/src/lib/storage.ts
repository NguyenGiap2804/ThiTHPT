import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

type UploadStorageMode = "auto" | "local" | "supabase";

type StoredUpload = {
  filename: string;
  url: string;
  storageProvider: "local" | "supabase";
  objectKey?: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "exam-assets";
const supabaseFolder = (process.env.SUPABASE_STORAGE_FOLDER || "exam-files")
  .replace(/^\/+|\/+$/g, "");

let supabaseClient: SupabaseClient | null = null;

export const localUploadsDir = path.join(process.cwd(), "uploads");

export const ensureLocalUploadsDir = async () => {
  await fs.mkdir(localUploadsDir, { recursive: true });
};

const getUploadStorageMode = (): UploadStorageMode => {
  const configured = process.env.UPLOAD_STORAGE?.toLowerCase();
  if (configured === "auto" || configured === "local" || configured === "supabase") {
    return configured;
  }
  return process.env.NODE_ENV === "production" ? "supabase" : "local";
};

const isSupabaseStorageConfigured = () =>
  Boolean(supabaseUrl && supabaseServiceRoleKey && supabaseBucket);

const getSupabaseClient = () => {
  if (!isSupabaseStorageConfigured()) {
    throw new Error(
      "Supabase Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET, or set UPLOAD_STORAGE=local for local development."
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
};

export const getUploadStorageLabel = () => {
  const mode = getUploadStorageMode();
  if (mode === "local") {
    return process.env.NODE_ENV === "production" ? "local-disabled-in-production" : "local";
  }
  if (mode === "auto" && !isSupabaseStorageConfigured() && process.env.NODE_ENV !== "production") return "local";
  return `supabase:${supabaseBucket}`;
};

export const buildStoredFilename = (originalName: string) => {
  const ext = path.extname(originalName).toLowerCase();
  const baseName =
    path
      .basename(originalName, ext)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "file";

  return `${Date.now()}-${uuidv4().slice(0, 8)}-${baseName}${ext}`;
};

const saveToLocalUploads = async (
  file: Express.Multer.File,
  filename: string
): Promise<StoredUpload> => {
  await ensureLocalUploadsDir();
  await fs.writeFile(path.join(localUploadsDir, filename), file.buffer);

  return {
    filename,
    url: `/uploads/${filename}`,
    storageProvider: "local",
  };
};

const saveToSupabaseStorage = async (
  file: Express.Multer.File,
  filename: string
): Promise<StoredUpload> => {
  const client = getSupabaseClient();
  const objectKey = [supabaseFolder, filename].filter(Boolean).join("/");

  const { data, error } = await client.storage.from(supabaseBucket).upload(
    objectKey,
    file.buffer,
    {
      contentType: file.mimetype,
      cacheControl: "31536000",
      upsert: false,
    }
  );

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = client.storage
    .from(supabaseBucket)
    .getPublicUrl(data.path);

  if (!publicUrlData.publicUrl) {
    throw new Error("Supabase Storage did not return a public URL for the uploaded file.");
  }

  return {
    filename,
    url: publicUrlData.publicUrl,
    storageProvider: "supabase",
    objectKey: data.path,
  };
};

export const saveUploadedFile = async (
  file: Express.Multer.File,
  filename: string
): Promise<StoredUpload> => {
  const mode = getUploadStorageMode();

  if (process.env.NODE_ENV === "production" && mode !== "supabase") {
    throw new Error(
      "Production uploads must use Supabase Storage. Set UPLOAD_STORAGE=supabase and configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET."
    );
  }

  if (mode === "local" || (mode === "auto" && !isSupabaseStorageConfigured() && process.env.NODE_ENV !== "production")) {
    return saveToLocalUploads(file, filename);
  }

  return saveToSupabaseStorage(file, filename);
};
