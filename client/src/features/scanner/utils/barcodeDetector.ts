import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const codeReader = new BrowserMultiFormatReader();

export const extractBarcodeFromImage = async (file: File): Promise<string> => {
  const imageSrc = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        // Use decodeFromImageElement which is designed for this use case
        const result = await codeReader.decodeFromImageElement(img);
        if (result && result.getText()) {
          resolve(result.getText());
        } else {
          reject(new Error('No barcode found in the image'));
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          reject(
            new Error(
              'No barcode found in the image. Please ensure the barcode is clearly visible.',
            ),
          );
        } else if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error('Failed to decode barcode from image'));
        }
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
};
