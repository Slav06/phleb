import Tesseract from 'tesseract.js';

// Placeholder for AI image analysis
export const analyzeImage = async (base64Image, type) => {
  // Convert base64 to blob
  const byteString = atob(base64Image);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'image/png' });

  // Run Tesseract OCR
  const { data: { text } } = await Tesseract.recognize(blob, 'eng');

  // For now, just return the raw text. You can later parse it to fill fields.
  return { ocrText: text };
}; 