
interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  width?: number;
  height?: number;
  blur?: boolean;
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async optimizeImage(
    imageUrl: string, 
    options: ImageOptimizationOptions = {}
  ): Promise<string> {
    const {
      quality = 0.8,
      format = 'webp',
      width,
      height,
      blur = false
    } = options;

    try {
      const img = await this.loadImage(imageUrl);
      
      // Calculate dimensions
      const targetWidth = width || img.naturalWidth;
      const targetHeight = height || img.naturalHeight;
      
      // Set canvas size
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
      
      // Apply blur filter if requested
      if (blur) {
        this.ctx.filter = 'blur(10px)';
      }
      
      // Draw and resize image
      this.ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Convert to optimized format
      const mimeType = `image/${format}`;
      return this.canvas.toDataURL(mimeType, quality);
      
    } catch (error) {
      console.error('Image optimization failed:', error);
      return imageUrl; // Return original if optimization fails
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Generate responsive image sizes
  generateResponsiveSizes(imageUrl: string): Promise<{
    small: string;
    medium: string;
    large: string;
  }> {
    return Promise.all([
      this.optimizeImage(imageUrl, { width: 480, quality: 0.7 }),
      this.optimizeImage(imageUrl, { width: 768, quality: 0.8 }),
      this.optimizeImage(imageUrl, { width: 1200, quality: 0.85 })
    ]).then(([small, medium, large]) => ({
      small,
      medium,
      large
    }));
  }

  // Create placeholder blur image
  createPlaceholder(imageUrl: string): Promise<string> {
    return this.optimizeImage(imageUrl, {
      width: 20,
      height: 20,
      blur: true,
      quality: 0.1
    });
  }
}

export const imageOptimizer = ImageOptimizer.getInstance();
