export function fileToOptimizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Imagen vacía.'));
        return;
      }

      // Si es pequeña (< 450 KB), conservar tal cual
      if (file.size <= 450 * 1024) {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const mime =
          file.type === 'image/png' && file.size < 1.5 * 1024 * 1024
            ? 'image/png'
            : 'image/jpeg';
        const optimized = canvas.toDataURL(mime, 0.86);
        resolve(optimized.length < result.length ? optimized : result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
