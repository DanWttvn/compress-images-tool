const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const archiver = require("archiver");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 50, // Max 50 files
  },
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Compression handler function
async function handleCompression(req, res) {
  try {
    const { quality, maxWidth, maxHeight, suffix } = req.body;
    const outputFormat = "webp";

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Create output directory
    const outputDir = path.join(__dirname, "compressed");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    // Process each uploaded file
    for (const file of req.files) {
      try {
        const inputPath = file.path;
        const filename = path.basename(
          file.originalname,
          path.extname(file.originalname)
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
          .webp({ quality: parseInt(quality) })
          .toFile(outputPath);

        // Get file sizes
        const originalSize = fs.statSync(inputPath).size;
        const compressedSize = fs.statSync(outputPath).size;
        const compressionRatio = (
          ((originalSize - compressedSize) / originalSize) *
          100
        ).toFixed(1);

        results.push({
          originalName: file.originalname,
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
          originalName: file.originalname,
          error: error.message,
          success: false,
        });
      }
    }

    // Create ZIP file with compressed images
    const zipPath = path.join(__dirname, "compressed_images.zip");
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
          totalFiles: req.files.length,
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
}

// API Routes (for Vercel compatibility)
app.post("/api/compress", upload.array("images", 50), handleCompression);

// Handle file upload and compression
app.post("/compress", upload.array("images", 50), handleCompression);

// Download compressed images ZIP
app.get("/download", (req, res) => {
  const zipPath = path.join(__dirname, "compressed_images.zip");

  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: "No compressed files found" });
  }

  res.download(zipPath, "compressed_images.zip", (err) => {
    if (err) {
      console.error("Download error:", err);
    }
  });
});

// API Routes (for Vercel compatibility)
app.get("/api/download", (req, res) => {
  const zipPath = path.join(__dirname, "compressed_images.zip");

  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: "No compressed files found" });
  }

  res.download(zipPath, "compressed_images.zip", (err) => {
    if (err) {
      console.error("Download error:", err);
    }
  });
});

// Cleanup uploaded files
app.post("/cleanup", (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "uploads");
    const compressedDir = path.join(__dirname, "compressed");
    const zipPath = path.join(__dirname, "compressed_images.zip");

    // Remove uploaded files
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    // Remove compressed files
    if (fs.existsSync(compressedDir)) {
      fs.rmSync(compressedDir, { recursive: true, force: true });
    }

    // Remove ZIP file
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    res.json({ success: true, message: "Files cleaned up successfully" });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ error: "Cleanup failed" });
  }
});

// API Routes (for Vercel compatibility)
app.post("/api/cleanup", (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "uploads");
    const compressedDir = path.join(__dirname, "compressed");
    const zipPath = path.join(__dirname, "compressed_images.zip");

    // Remove uploaded files
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    // Remove compressed files
    if (fs.existsSync(compressedDir)) {
      fs.rmSync(compressedDir, { recursive: true, force: true });
    }

    // Remove ZIP file
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    res.json({ success: true, message: "Files cleaned up successfully" });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ error: "Cleanup failed" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 10MB." });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ error: "Too many files. Maximum is 50 files." });
    }
  }

  console.error("Server error:", error);
  res.status(500).json({ error: "Server error", details: error.message });
});

app.listen(PORT, () => {
  console.log(
    `🚀 Image compression server running on http://localhost:${PORT}`
  );
  console.log(`📁 Upload directory: ${path.join(__dirname, "uploads")}`);
  console.log(`📁 Compressed directory: ${path.join(__dirname, "compressed")}`);
});
