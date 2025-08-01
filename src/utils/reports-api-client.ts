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
        hasReport: response && typeof response === 'object' && 'report' in response,
        responseType: typeof response,
        isUnknownUrl: response === 'Unknown URL',
        responsePreview: typeof response === 'object' ? JSON.stringify(response).substring(0, 200) : response
      });

      // Check for "Unknown URL" response (must check string type first)
      if (typeof response === 'string') {
        if (response === 'Unknown URL' || response.includes('Unknown')) {
          throw new Error(`Reports API endpoint not found: ${endpoint}`);
        }
        // If it's any other string, it's an unexpected response
        throw new Error(`Unexpected string response from Reports API: ${response}`);
      }

      // Check for different response structures
      if (response && typeof response === 'object') {
        // Some endpoints wrap in 'report'
        if ('report' in response) {
          logger.debug('Unwrapping report response');
          return response.report as T;
        }
        
        // Happiness endpoints might return data directly or with different structure
        // Check if this looks like a report response (has expected properties)
        if ('current' in response || 'happinessScore' in response || 
            'totalRatings' in response || 'greatCount' in response) {
          logger.debug('Response appears to be unwrapped report data');
          return response as T;
        }
        
        // For paginated responses (like ratings)
        if ('_embedded' in response || 'items' in response || 'results' in response) {
          logger.debug('Response appears to be paginated data');
          return response as T;
        }
      }

      // If no special structure detected, return as-is
      logger.debug('Returning response as-is');
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