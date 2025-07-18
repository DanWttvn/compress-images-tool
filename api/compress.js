const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

// Vercel serverless function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse multipart form data
    const { files, quality, maxWidth, maxHeight, suffix } = req.body;
    const outputFormat = "webp";

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Create temporary directories
    const tmpDir = "/tmp";
    const outputDir = path.join(tmpDir, "compressed");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    // Process each uploaded file
    for (const file of files) {
      try {
        const inputPath = file.path || file.tempFilePath;
        const filename = path.basename(
          file.name || file.originalname,
          path.extname(file.name || file.originalname)
        );
        const outputFilename = suffix ? `${filename}${suffix}` : filename;
        const outputPath = path.join(
          outputDir,
          `${outputFilename}.${outputFormat}`
        );

        // Create sharp instance
        let sharpInstance = sharp(inputPath);

        // Resize if needed
        if (maxWidth || maxHeight) {
          sharpInstance = sharpInstance.resize(
            maxWidth ? parseInt(maxWidth) : null,
            maxHeight ? parseInt(maxHeight) : null,
            {
              fit: "inside",
              withoutEnlargement: true,
            }
          );
        }

        // Apply WebP compression
        await sharpInstance
          .webp({ quality: parseInt(quality) || 95 })
          .toFile(outputPath);

        // Get file sizes
        const originalSize = fs.statSync(inputPath).size;
        const compressedSize = fs.statSync(outputPath).size;
        const compressionRatio = (
          ((originalSize - compressedSize) / originalSize) *
          100
        ).toFixed(1);

        results.push({
          originalName: file.name || file.originalname,
          compressedName: `${outputFilename}.${outputFormat}`,
          originalSize,
          compressedSize,
          compressionRatio: parseFloat(compressionRatio),
          success: true,
        });

        totalOriginalSize += originalSize;
        totalCompressedSize += compressedSize;
      } catch (error) {
        results.push({
          originalName: file.name || file.originalname,
          error: error.message,
          success: false,
        });
      }
    }

    // Create ZIP file with compressed images
    const zipPath = path.join(tmpDir, "compressed_images.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const totalCompressionRatio = (
        ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) *
        100
      ).toFixed(1);

      res.json({
        success: true,
        results,
        summary: {
          totalFiles: files.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          totalOriginalSize,
          totalCompressedSize,
          totalCompressionRatio: parseFloat(totalCompressionRatio),
          zipFile: "compressed_images.zip",
        },
      });
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(outputDir, false);
    archive.finalize();
  } catch (error) {
    console.error("Compression error:", error);
    res
      .status(500)
      .json({ error: "Compression failed", details: error.message });
  }
};
