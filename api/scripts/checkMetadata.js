import { Storage } from "@google-cloud/storage";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = new Storage({
  keyFilename:
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, "../gcs-key.json"),
});

const bucketName = process.env.GCS_BUCKET_NAME || "metaskills";
const bucket = storage.bucket(bucketName);

const checkMetadata = async (filename) => {
  try {
    const file = bucket.file(filename);
    const [metadata] = await file.getMetadata();
    console.log(`\nMetadata for ${filename}:`);
    console.log("--------------------------------");
    console.log("Custom Metadata:", metadata.metadata);
    console.log("--------------------------------");
  } catch (error) {
    console.error(`Error fetching metadata for ${filename}:`, error.message);
  }
};

const filename = process.argv[2];
if (!filename) {
  console.log("Please provide a filename (e.g., 1764096757712-image.jpg)");
} else {
  checkMetadata(filename);
}
