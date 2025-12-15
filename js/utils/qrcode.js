/**
 * QR Code generation utility
 * Uses qrcode-generator library (MIT license)
 */

// Load library from CDN
const QR_LIB_URL = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';

let qrLib = null;

/**
 * Load QR code library if not already loaded
 */
async function ensureQRLibLoaded() {
    if (qrLib) return qrLib;

    // Check if already loaded globally
    if (typeof window.qrcode !== 'undefined') {
        qrLib = window.qrcode;
        return qrLib;
    }

    // Load from CDN
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = QR_LIB_URL;
        script.onload = () => {
            qrLib = window.qrcode;
            resolve(qrLib);
        };
        script.onerror = () => reject(new Error('Failed to load QR code library'));
        document.head.appendChild(script);
    });
}

/**
 * Generate QR code as data URL
 * @param {string} text - Text to encode
 * @param {number} size - Image size in pixels (default 200)
 * @returns {Promise<string>} Data URL of QR code image
 */
export async function generateQRCode(text, size = 200) {
    await ensureQRLibLoaded();

    // Create QR code
    const qr = qrcode(0, 'M'); // Type 0 (auto), error correction 'M' (medium)
    qr.addData(text);
    qr.make();

    // Generate as data URL
    const cellSize = Math.floor(size / qr.getModuleCount());
    const margin = 4;

    return qr.createDataURL(cellSize, margin);
}

/**
 * Generate QR code and render to canvas element
 * @param {HTMLCanvasElement} canvas - Canvas element to render to
 * @param {string} text - Text to encode
 */
export async function renderQRToCanvas(canvas, text) {
    const dataURL = await generateQRCode(text, canvas.width);

    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve, reject) => {
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve();
        };
        img.onerror = reject;
        img.src = dataURL;
    });
}
