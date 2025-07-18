# 🖼️ Bulk Image Compression Tool

A fast and efficient Node.js tool to compress multiple images at once using Sharp. Perfect for optimizing images for web, reducing storage space, or batch processing photo collections.

## ✨ Features

- **Web Interface**: Modern drag-and-drop interface for easy file upload
- **Bulk processing**: Compress hundreds of images in one go
- **Multiple formats**: Support for JPG, JPEG, PNG, and WebP
- **Smart resizing**: Optional width/height limits with aspect ratio preservation
- **Format conversion**: Convert to WebP, JPEG, or PNG
- **Quality control**: Adjustable compression quality (1-100)
- **Progress tracking**: Real-time compression statistics
- **ZIP download**: Download all compressed images as a single ZIP file
- **Memory efficient**: Processes images sequentially to avoid memory issues

## 🚀 Quick Start

### Web Interface (Recomendado)

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the web server**:

   ```bash
   npm run web
   ```

3. **Open your browser**:

   ```
   http://localhost:3000
   ```

4. **Upload and compress images** using the web interface!

### Command Line Interface

1. **Create input directory and add images**:

   ```bash
   mkdir input
   # Copy your images to the input folder
   ```

2. **Run compression**:
   ```bash
   npm start
   ```

## 🌐 Deploy to Vercel

This project is ready to deploy on Vercel! Follow these steps:

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Deploy**:

   ```bash
   vercel
   ```

3. **Follow the prompts** and your app will be live!

### Vercel Features:

- ✅ Serverless functions for image processing
- ✅ Automatic scaling
- ✅ Global CDN
- ✅ Free tier available

## 📖 Usage

### Basic Usage

```bash
# Compress all images in ./input to ./output
node compress.js

# With custom quality
node compress.js --quality 90

# Convert to JPEG format
node compress.js --format jpeg

# Resize to max 800px width
node compress.js --width 800
```

### Advanced Options

```bash
# Custom input/output directories
node compress.js --input ./photos --output ./compressed

# High quality JPEG with size limits
node compress.js --quality 95 --format jpeg --width 1920 --height 1080

# Convert to WebP (best compression)
node compress.js --format webp --quality 85

# Keep original format
node compress.js --format original --quality 80
```

### Command Line Options

| Option      | Short | Description               | Default    |
| ----------- | ----- | ------------------------- | ---------- |
| `--quality` | `-q`  | JPEG/WebP quality (1-100) | 80         |
| `--input`   | `-i`  | Input directory           | `./input`  |
| `--output`  | `-o`  | Output directory          | `./output` |
| `--format`  | `-f`  | Output format             | `webp`     |
| `--width`   | `-w`  | Maximum width             | 1920       |
| `--height`  | `-h`  | Maximum height            | 1080       |
| `--help`    |       | Show help message         |            |

### Output Formats

- **`webp`**: Best compression, modern format (recommended)
- **`jpeg`**: Widely compatible, good compression
- **`png`**: Lossless, larger files
- **`original`**: Keep original format

## 📁 Directory Structure

```
compress-image-tool/
├── public/          # Web interface files
│   ├── index.html   # Main web page
│   ├── styles.css   # Styling
│   └── script.js    # Frontend JavaScript
├── api/             # Vercel serverless functions
│   ├── compress.js  # Image compression API
│   ├── download.js  # ZIP download API
│   └── cleanup.js   # File cleanup API
├── input/           # Put your original images here (CLI)
│   ├── photo1.jpg
│   ├── photo2.png
│   └── ...
├── output/          # Compressed images will appear here (CLI)
│   ├── photo1_compressed.webp
│   ├── photo2_compressed.webp
│   └── ...
├── server.js        # Web server
├── compress.js      # CLI script
├── vercel.json      # Vercel configuration
├── package.json
└── README.md
```

## 🎯 Use Cases

- **Web optimization**: Compress images for faster website loading
- **Storage cleanup**: Reduce photo library size
- **Email attachments**: Make images email-friendly
- **Social media**: Optimize for platform requirements
- **Backup compression**: Save space on backups

## 📊 Performance

Typical compression results:

- **WebP**: 60-80% size reduction
- **JPEG**: 40-70% size reduction
- **PNG**: 20-50% size reduction (lossless)

## 🔧 Configuration

You can modify the default settings in `compress.js`:

```javascript
const config = {
  inputDir: "./input",
  outputDir: "./output",
  quality: 80,
  formats: ["jpg", "jpeg", "png", "webp"],
  maxWidth: 1920,
  maxHeight: 1080,
  outputFormat: "webp",
  suffix: "_compressed",
};
```

## 🛠️ Requirements

- Node.js 18+
- npm or yarn

## 📝 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

Found a bug or have a feature request? Open an issue or submit a pull request!
