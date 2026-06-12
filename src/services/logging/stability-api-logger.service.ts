
import { apiLogger } from './api-logger.service';

export class StabilityAPILoggerService {
  /**
   * Logs a request to the Stability API
   */
  static async logRequest(drinkName: string, drinkDescription: string): Promise<void> {
    try {
      await apiLogger.logRequest('stability-ai-image-generation', {
        drinkName,
        drinkDescription,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error logging Stability API request:", error);
    }
  }

  /**
   * Logs a successful response from the Stability API
   */
  static async logSuccess(drinkName: string, imageLength: number): Promise<void> {
    try {
      await apiLogger.logResponse(
        'stability-ai-image-generation',
        {
          drinkName,
          imageReceived: true,
          imageSize: imageLength,
          timestamp: new Date().toISOString()
        },
        200
      );
    } catch (error) {
      console.error("Error logging Stability API success:", error);
    }
  }

  /**
   * Logs an error response from the Stability API
   */
  static async logError(drinkName: string, errorMessage: string, statusCode: number = 500): Promise<void> {
    try {
      await apiLogger.logResponse(
        'stability-ai-image-generation',
        {
          drinkName,
          error: true,
          timestamp: new Date().toISOString()
        },
        statusCode,
        errorMessage
      );
    } catch (error) {
      console.error("Error logging Stability API error:", error);
    }
  }
}
