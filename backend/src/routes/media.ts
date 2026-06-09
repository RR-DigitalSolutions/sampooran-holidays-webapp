import { Router, Request, Response } from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary";
import { logger } from "../lib/logger";
import { Readable } from "stream";

const router = Router();

// ─── Cloudinary Folder Structure ──────────────────────────────────────────────
// All uploads live under the root "sampooran_holidays" Cloudinary folder.
// Each CMS section uploads to its own dedicated subfolder for easy management.
//
//  sampooran_holidays/
//    hero_slides/          ← Homepage hero carousel images
//    themes/               ← Travel theme / category cover images
//    offers/               ← Promotional offer card images
//    sponsored_ads/        ← Sponsored banner ad images
//    destinations/
//      countries/          ← Country cover images
//      states/             ← State/region cover images
//      places/             ← City/place cover images
//    packages/             ← Package cover & gallery images
//    blogs/                ← Blog post cover images
//    misc/                 ← Fallback for any uncategorised uploads
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = "sampooran_holidays";

// Strict allowlist — prevents arbitrary folder injection / path traversal
const ALLOWED_FOLDERS: Record<string, string> = {
  "hero_slides":            `${ROOT}/hero_slides`,
  "themes":                 `${ROOT}/themes`,
  "offers":                 `${ROOT}/offers`,
  "sponsored_ads":          `${ROOT}/sponsored_ads`,
  "destinations/countries": `${ROOT}/destinations/countries`,
  "destinations/states":    `${ROOT}/destinations/states`,
  "destinations/places":    `${ROOT}/destinations/places`,
  "packages":               `${ROOT}/packages`,
  "blogs":                  `${ROOT}/blogs`,
  "misc":                   `${ROOT}/misc`,
};

// Configure multer for memory storage (we will stream the buffer directly to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * POST /api/media/upload?folder=<section>
 *
 * Uploads a single image to Cloudinary under the section-specific subfolder.
 * The `folder` query param must match one of the keys in ALLOWED_FOLDERS.
 * Falls back to `sampooran_holidays/misc` if omitted or invalid.
 *
 * Returns: { url, publicId, folder, format, bytes }
 */
router.post("/upload", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file provided" });
      return;
    }

    // Resolve the target Cloudinary folder (strict allowlist + dynamic vendor property pattern)
    const requestedFolder = String(req.query.folder || "").trim();
    let cloudinaryFolder = `${ROOT}/misc`;

    if (requestedFolder.startsWith("vendors/hotel_")) {
      const parts = requestedFolder.split("/");
      const hotelId = parts[1]?.replace("hotel_", "");
      if (hotelId && /^\d+$/.test(hotelId)) {
        cloudinaryFolder = `${ROOT}/vendors/hotel_${hotelId}`;
      }
    } else {
      cloudinaryFolder = ALLOWED_FOLDERS[requestedFolder] ?? `${ROOT}/misc`;
    }

    // Wrap Cloudinary's upload_stream in a promise
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        // Convert buffer to stream and pipe to cloudinary
        const readableStream = new Readable({
          read() {
            this.push(req.file!.buffer);
            this.push(null);
          },
        });

        readableStream.pipe(stream);
      });
    };

    const result = (await uploadToCloudinary()) as any;

    logger.info(
      { folder: cloudinaryFolder, publicId: result.public_id, bytes: result.bytes },
      "Image uploaded to Cloudinary"
    );

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      folder: cloudinaryFolder,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    logger.error({ error }, "Error uploading to Cloudinary");
    res.status(500).json({ message: "Upload failed", error: String(error) });
  }
});

export default router;
