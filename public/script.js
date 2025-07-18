// DOM Elements
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const files = document.getElementById("files");
const compressionForm = document.getElementById("compressionForm");
const qualitySlider = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const progressSection = document.getElementById("progressSection");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const resultsSection = document.getElementById("resultsSection");
const totalFiles = document.getElementById("totalFiles");
const successfulFiles = document.getElementById("successfulFiles");
const compressionRatio = document.getElementById("compressionRatio");
const spaceSaved = document.getElementById("spaceSaved");
const downloadBtn = document.getElementById("downloadBtn");
const newCompressionBtn = document.getElementById("newCompressionBtn");
const clearBtn = document.getElementById("clearBtn");
const fileResults = document.getElementById("fileResults");
const toast = document.getElementById("toast");

// State
let selectedFiles = [];

// Event Listeners
uploadArea.addEventListener("click", () => fileInput.click());
uploadArea.addEventListener("dragover", handleDragOver);
uploadArea.addEventListener("dragleave", handleDragLeave);
uploadArea.addEventListener("drop", handleDrop);
fileInput.addEventListener("change", handleFileSelect);
qualitySlider.addEventListener("input", updateQualityValue);
compressionForm.addEventListener("submit", handleCompression);
clearBtn.addEventListener("click", clearFiles);
downloadBtn.addEventListener("click", downloadZip);
newCompressionBtn.addEventListener("click", resetForm);

// Drag and Drop Handlers
function handleDragOver(e) {
  e.preventDefault();
  uploadArea.classList.add("dragover");
}

function handleDragLeave(e) {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove("dragover");

  const droppedFiles = Array.from(e.dataTransfer.files);
  const imageFiles = droppedFiles.filter((file) =>
    file.type.startsWith("image/")
  );

  if (imageFiles.length === 0) {
    showToast("Por favor, selecciona solo archivos de imagen", "error");
    return;
  }

  addFiles(imageFiles);
}

// File Selection Handler
function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  addFiles(files);
}

// Add Files to List
function addFiles(newFiles) {
  // Filter for image files and size limit
  const validFiles = newFiles.filter((file) => {
    if (!file.type.startsWith("image/")) {
      showToast(`${file.name} no es un archivo de imagen válido`, "error");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast(`${file.name} es demasiado grande (máximo 10MB)`, "error");
      return false;
    }

    return true;
  });

  if (validFiles.length === 0) return;

  // Add to selected files
  selectedFiles = [...selectedFiles, ...validFiles];

  // Limit to 50 files
  if (selectedFiles.length > 50) {
    selectedFiles = selectedFiles.slice(0, 50);
    showToast("Máximo 50 archivos permitidos", "info");
  }

  displayFiles();
  showToast(`${validFiles.length} archivo(s) agregado(s)`, "success");
}

// Display Files
function displayFiles() {
  if (selectedFiles.length === 0) {
    fileList.style.display = "none";
    return;
  }

  fileList.style.display = "block";
  files.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item fade-in";

    const icon = getFileIcon(file.name);
    const size = formatFileSize(file.size);

    fileItem.innerHTML = `
            <i class="${icon}"></i>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${size}</div>
            </div>
            <button onclick="removeFile(${index})" class="btn btn-secondary">
                <i class="fas fa-times"></i>
            </button>
        `;

    files.appendChild(fileItem);
  });
}

// Remove File
function removeFile(index) {
  selectedFiles.splice(index, 1);
  displayFiles();
}

// Get File Icon
function getFileIcon(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "fas fa-file-image";
    case "png":
      return "fas fa-file-image";
    case "webp":
      return "fas fa-file-image";
    default:
      return "fas fa-file";
  }
}

// Format File Size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Update Quality Value
function updateQualityValue() {
  qualityValue.textContent = qualitySlider.value;
}

// Handle Compression
async function handleCompression(e) {
  e.preventDefault();

  if (selectedFiles.length === 0) {
    showToast("Por favor, selecciona al menos un archivo", "error");
    return;
  }

  const formData = new FormData();

  // Add files
  selectedFiles.forEach((file) => {
    formData.append("images", file);
  });

  // Add form data (except outputFormat)
  const formValues = new FormData(compressionForm);
  for (let [key, value] of formValues.entries()) {
    if (key !== "outputFormat") {
      formData.append(key, value);
    }
  }
  // Always set outputFormat to webp
  formData.append("outputFormat", "webp");

  // Show progress
  showProgress();

  try {
    const response = await fetch("/api/compress", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      showResults(result);
      showToast("Compresión completada exitosamente", "success");
    } else {
      throw new Error(result.error || "Error en la compresión");
    }
  } catch (error) {
    console.error("Compression error:", error);
    showToast(`Error: ${error.message}`, "error");
    hideProgress();
  }
}

// Show Progress
function showProgress() {
  progressSection.style.display = "block";
  progressFill.style.width = "0%";
  progressText.textContent = "Subiendo archivos...";

  // Simulate progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    progressFill.style.width = progress + "%";

    if (progress < 30) {
      progressText.textContent = "Subiendo archivos...";
    } else if (progress < 60) {
      progressText.textContent = "Comprimiendo imágenes...";
    } else {
      progressText.textContent = "Finalizando compresión...";
    }
  }, 500);

  // Store interval for cleanup
  window.progressInterval = interval;
}

// Hide Progress
function hideProgress() {
  progressSection.style.display = "none";
  if (window.progressInterval) {
    clearInterval(window.progressInterval);
  }
}

// Show Results
function showResults(result) {
  hideProgress();

  // Update summary cards
  totalFiles.textContent = result.summary.totalFiles;
  successfulFiles.textContent = result.summary.successful;
  compressionRatio.textContent = result.summary.totalCompressionRatio + "%";
  spaceSaved.textContent = formatFileSize(
    result.summary.totalOriginalSize - result.summary.totalCompressedSize
  );

  // Show file results
  displayFileResults(result.results);

  // Show results section
  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

// Display File Results
function displayFileResults(results) {
  fileResults.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("div");
    resultItem.className = `file-result ${
      result.success ? "success" : "error"
    } fade-in`;

    if (result.success) {
      const originalSize = formatFileSize(result.originalSize);
      const compressedSize = formatFileSize(result.compressedSize);

      resultItem.innerHTML = `
                <div class="file-result-info">
                    <div class="file-result-name">${result.originalName}</div>
                    <div class="file-result-stats">
                        ${originalSize} → ${compressedSize} (${result.compressionRatio}% reducción)
                    </div>
                </div>
                <span class="file-result-status success">✓ Completado</span>
            `;
    } else {
      resultItem.innerHTML = `
                <div class="file-result-info">
                    <div class="file-result-name">${result.originalName}</div>
                    <div class="file-result-stats">Error: ${result.error}</div>
                </div>
                <span class="file-result-status error">✗ Error</span>
            `;
    }

    fileResults.appendChild(resultItem);
  });
}

// Download ZIP
async function downloadZip() {
  try {
    const response = await fetch("/api/download");

    if (!response.ok) {
      throw new Error("No se encontró el archivo ZIP");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed_images.zip";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showToast("Descarga iniciada", "success");
  } catch (error) {
    console.error("Download error:", error);
    showToast("Error al descargar: " + error.message, "error");
  }
}

// Clear Files
function clearFiles() {
  selectedFiles = [];
  displayFiles();
  showToast("Archivos limpiados", "info");
}

// Reset Form
function resetForm() {
  selectedFiles = [];
  displayFiles();
  compressionForm.reset();
  resultsSection.style.display = "none";
  progressSection.style.display = "none";
  qualityValue.textContent = "95";
  showToast("Formulario reiniciado", "info");
}

// Show Toast
function showToast(message, type = "info") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  updateQualityValue();

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    fetch("/api/cleanup", { method: "POST" }).catch(console.error);
  });
});
