const fs = require("fs");
const path = require("path");

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
    const tmpDir = "/tmp";
    const compressedDir = path.join(tmpDir, "compressed");
    const zipPath = path.join(tmpDir, "compressed_images.zip");

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
};
