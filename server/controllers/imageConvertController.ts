// src/controllers/ImageConversionController.ts
import { Request, Response } from 'express';
import axios from 'axios';
import sharp from 'sharp';
import { createHash } from 'crypto';

// Types
interface ConversionRequest {
  url: string;
  format?: 'png' | 'jpeg' | 'webp';
  width?: number;
  height?: number;
  quality?: number;
}

interface ConversionResponse {
  success: boolean;
  dataUrl?: string;
  mimeType?: string;
  error?: string;
  cached?: boolean;
}

// In-memory cache (for production, use Redis or similar)
const imageCache = new Map<string, { dataUrl: string; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB limit

// Utility function to create cache key
const createCacheKey = (url: string, options: any): string => {
  return createHash('md5').update(`${url}-${JSON.stringify(options)}`).digest('hex');
};

// Clean expired cache entries
const cleanExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      imageCache.delete(key);
    }
  }
};

// Main conversion function
export const convertImage = async (req: Request, res: Response): Promise<void> => {
  try {

    let { url, format = 'png', width, height, quality = 90 } = req.query as ConversionRequest;
    quality = parseInt(quality as any, 10) || 90;
    width = width ? parseInt(width as any, 10) : undefined;
    height = height ? parseInt(height as any, 10) : undefined; 
    // Validate input
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid URL parameter'
      });
      return;
    }

    // Security: Validate URL format
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        res.status(400).json({
          success: false,
          error: 'Invalid URL protocol. Only HTTP/HTTPS allowed.'
        });
        return;
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
      return;
    }

    // Check cache
    const cacheKey = createCacheKey(url, { format, width, height, quality });
    const cachedItem = imageCache.get(cacheKey);
    
    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
      // Return cached result
      res.json({
        success: true,
        dataUrl: cachedItem.dataUrl,
        mimeType: `image/${format}`,
        cached: true
      });
      return;
    }

    // Fetch the image
    console.log(`Fetching image from: ${url}`);
    
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      timeout: 15000, // 15 second timeout
      maxContentLength: MAX_IMAGE_SIZE,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Property PDF Generator)',
        'Accept': 'image/*'
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Empty image response');
    }

    // Process with Sharp
    let image = sharp(response.data);
    
    // Apply transformations if specified
    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to desired format
    const conversionOptions: any = { quality };
    
    switch (format) {
      case 'jpeg':
        image = image.jpeg(conversionOptions);
        break;
      case 'webp':
        image = image.webp(conversionOptions);
        break;
      case 'png':
      default:
        image = image.png(conversionOptions);
        break;
    }

    // Convert to buffer
    const buffer = await image.toBuffer();
    
    // Convert to base64 data URL
    const base64 = buffer.toString('base64');
    const mimeType = `image/${format}`;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Cache the result
    imageCache.set(cacheKey, {
      dataUrl,
      timestamp: Date.now()
    });

    // Clean expired cache entries periodically
    cleanExpiredCache();

    // Send response
    res.json({
      success: true,
      dataUrl,
      mimeType,
      cached: false
    });

  } catch (error: any) {
    console.error('Image conversion error:', error.message);
    
    // Provide specific error messages
    let errorMessage = 'Failed to convert image';
    let statusCode = 500;
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Image fetch timed out';
      statusCode = 408;
    } else if (error.response?.status === 404) {
      errorMessage = 'Image not found';
      statusCode = 404;
    } else if (error.message.includes('maximum size')) {
      errorMessage = 'Image size exceeds limit';
      statusCode = 413;
    } else if (error.message.includes('Input buffer contains unsupported image format')) {
      errorMessage = 'Unsupported image format';
      statusCode = 415;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cacheSize: imageCache.size,
    sharpVersion: sharp.versions.vips
  });
};

// Batch conversion endpoint
export const convertImagesBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { urls, options } = req.body;
    
    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid or empty URLs array'
      });
      return;
    }

    // Limit batch size
    const maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE || '10', 10);
    const urlsToProcess = urls.slice(0, maxBatchSize);
    
    const results = await Promise.allSettled(
      urlsToProcess.map(async (url: string) => {
        // Simulate individual conversion
        const cacheKey = createCacheKey(url, options || {});
        const cachedItem = imageCache.get(cacheKey);
        
        if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
          return {
            url,
            success: true,
            dataUrl: cachedItem.dataUrl,
            cached: true
          };
        }
        
        // In a real implementation, you'd call convertImage logic
        // For brevity, this returns a placeholder
        return {
          url,
          success: true,
          dataUrl: `data:image/png;base64,placeholder`,
          cached: false
        };
      })
    );

    const formattedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: urlsToProcess[index],
          success: false,
          error: result.reason.message
        };
      }
    });

    res.json({
      success: true,
      results: formattedResults,
      processed: formattedResults.length,
      failed: formattedResults.filter(r => !r.success).length
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Batch processing failed',
      details: error.message
    });
  }
};