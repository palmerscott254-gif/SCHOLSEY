import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async analyzeImage(file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new HttpException(
        'Invalid file type. Only images are supported.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(
        `${this.aiServiceUrl}/analyze`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000, // 30 seconds timeout
        },
      );

      return {
        success: true,
        analysis: response.data,
        source: 'ai_service',
      };
    } catch (error) {
      // Log error for monitoring
      console.error('[AI Service Error]', {
        message: error.message,
        url: this.aiServiceUrl,
        filename: file.originalname,
        timestamp: new Date().toISOString(),
      });

      // Return service unavailable error - do not return mock data
      throw new HttpException(
        {
          success: false,
          error: 'AI analysis service temporarily unavailable',
          details: 'Please try again in a few moments. If the problem persists, contact support.',
          code: 'AI_SERVICE_UNAVAILABLE',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
