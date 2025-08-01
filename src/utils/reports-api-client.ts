import { HelpScoutClient } from './helpscout-client.js';
import { logger } from './logger.js';

/**
 * Wrapper class for Help Scout Reports API that handles response unwrapping
 */
export class ReportsApiClient {
  constructor(private client: HelpScoutClient) {}

  /**
   * Get a report from the Help Scout Reports API
   * The Reports API returns responses wrapped in a 'report' object
   */
  async getReport<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<any>(endpoint, params);
      
      // Log the raw response structure for debugging
      logger.debug('Reports API raw response', {
        endpoint,
        responseKeys: response ? Object.keys(response) : [],
        hasReport: response && 'report' in response,
        responseType: typeof response,
        isUnknownUrl: response === 'Unknown URL'
      });

      // Check for "Unknown URL" response (must check string type first)
      if (typeof response === 'string') {
        if (response === 'Unknown URL' || response.includes('Unknown')) {
          throw new Error(`Reports API endpoint not found: ${endpoint}`);
        }
        // If it's any other string, it's an unexpected response
        throw new Error(`Unexpected string response from Reports API: ${response}`);
      }

      // The Reports API wraps responses in a 'report' object
      if (response && typeof response === 'object' && 'report' in response) {
        logger.debug('Unwrapping report response');
        return response.report as T;
      }

      // If no wrapping, return as-is
      return response as T;
    } catch (error) {
      logger.error('Reports API error', { 
        endpoint, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
}