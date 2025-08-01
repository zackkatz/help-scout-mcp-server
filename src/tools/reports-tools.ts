import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createMcpToolError } from '../utils/mcp-errors.js';
import { Injectable, ServiceContainer } from '../utils/service-container.js';
import { z } from 'zod';

/**
 * Constants for Reports tool operations
 */
const REPORTS_TOOL_CONSTANTS = {
  // Default time ranges
  DEFAULT_DAYS_BACK: 30, // 1 month default
  MAX_DAYS_BACK: 730, // 2 years
  
  // Result limits
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 500,
  
  // Report types
  REPORT_TYPES: {
    CHAT: 'chat',
    EMAIL: 'email',
    PHONE: 'phone',
    USER: 'user',
    TEAM: 'team',
    COMPANY: 'company',
    HAPPINESS: 'happiness',
    DOCS: 'docs',
    CONVERSATIONS: 'conversations',
  } as const,
  
  // View by options
  VIEW_BY: {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
  } as const,
} as const;

/**
 * Input schemas for Reports tools
 */
export const GetTopArticlesInputSchema = z.object({
  sites: z.array(z.string()).optional()
    .describe('Filter by specific site IDs'),
  collections: z.array(z.string()).optional()
    .describe('Filter by specific collection IDs'),
  limit: z.number().min(1).max(REPORTS_TOOL_CONSTANTS.MAX_LIMIT).default(REPORTS_TOOL_CONSTANTS.DEFAULT_LIMIT)
    .describe(`Number of top articles to return (max ${REPORTS_TOOL_CONSTANTS.MAX_LIMIT})`),
  includeStats: z.boolean().default(true)
    .describe('Include detailed statistics for each article'),
});

// Base schema for all report queries
const BaseReportSchema = z.object({
  start: z.string().datetime()
    .describe('Start date for the report period (ISO 8601)'),
  end: z.string().datetime()
    .describe('End date for the report period (ISO 8601)'),
  previousStart: z.string().datetime().optional()
    .describe('Start date for comparison period (ISO 8601)'),
  previousEnd: z.string().datetime().optional()
    .describe('End date for comparison period (ISO 8601)'),
});

// Schema for conversation-related reports (chat, email, phone)
export const GetConversationReportInputSchema = BaseReportSchema.extend({
  mailboxes: z.array(z.string()).optional()
    .describe('Filter by specific mailbox IDs'),
  folders: z.array(z.string()).optional()
    .describe('Filter by specific folder IDs'),
  tags: z.array(z.string()).optional()
    .describe('Filter by specific tag IDs'),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional()
    .describe('Filter by conversation types'),
  viewBy: z.enum(['day', 'week', 'month']).optional()
    .describe('Group results by time period'),
});

// Schema for user/team reports
export const GetUserReportInputSchema = BaseReportSchema.extend({
  user: z.string().optional()
    .describe('User ID for individual report'),
  mailboxes: z.array(z.string()).optional()
    .describe('Filter by specific mailbox IDs'),
  tags: z.array(z.string()).optional()
    .describe('Filter by specific tag IDs'),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional()
    .describe('Filter by conversation types'),
  viewBy: z.enum(['day', 'week', 'month']).optional()
    .describe('Group results by time period'),
  officeHours: z.boolean().optional()
    .describe('Filter by office hours only'),
});

// Schema for company reports
export const GetCompanyReportInputSchema = BaseReportSchema.extend({
  mailboxes: z.array(z.string()).optional()
    .describe('Filter by specific mailbox IDs'),
  tags: z.array(z.string()).optional()
    .describe('Filter by specific tag IDs'),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional()
    .describe('Filter by conversation types'),
  viewBy: z.enum(['day', 'week', 'month']).optional()
    .describe('Group results by time period'),
});

// Schema for happiness reports
export const GetHappinessReportInputSchema = BaseReportSchema.extend({
  mailboxes: z.array(z.string()).optional()
    .describe('Filter by specific mailbox IDs'),
  folders: z.array(z.string()).optional()
    .describe('Filter by specific folder IDs'),
  tags: z.array(z.string()).optional()
    .describe('Filter by specific tag IDs'),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional()
    .describe('Filter by conversation types'),
  rating: z.array(z.enum(['great', 'ok', 'not-good'])).optional()
    .describe('Filter by specific ratings (note: API uses "ok" and "not-good", not "okay" and "bad")'),
  viewBy: z.enum(['day', 'week', 'month']).optional()
    .describe('Group results by time period'),
});

// Schema for docs reports
export const GetDocsReportInputSchema = BaseReportSchema.extend({
  sites: z.array(z.string()).optional()
    .describe('Filter by specific Docs site IDs'),
});

/**
 * Types for Reports API responses
 */

// Common report metrics
export interface ReportMetrics {
  count?: number;
  previousCount?: number;
  percentChange?: number;
  trend?: 'up' | 'down' | 'neutral';
}

// Base report response structure
export interface BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    [key: string]: any;
  };
  previous?: {
    startDate: string;
    endDate: string;
    [key: string]: any;
  };
  comparison?: {
    [key: string]: ReportMetrics;
  };
}

// Conversation report response (chat, email, phone)
export interface ConversationReportResponse extends BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    totalConversations: number;
    newConversations: number;
    customers: number;
    conversationsPerDay: number;
    busiestDay?: {
      date: string;
      conversations: number;
    };
    tags?: Array<{
      id: string;
      name: string;
      count: number;
    }>;
    resolutionTime?: {
      avg: number;
      min: number;
      max: number;
    };
    responseTime?: {
      avg: number;
      firstResponseAvg: number;
    };
  };
}

// User/Team report response
export interface UserReportResponse extends BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    totalReplies: number;
    conversationsHandled: number;
    customersHelped: number;
    happinessScore?: number;
    avgResponseTime?: number;
    avgResolutionTime?: number;
    repliesPerConversation?: number;
  };
  users?: Array<{
    id: string;
    name: string;
    email: string;
    stats: {
      replies: number;
      conversationsHandled: number;
      customersHelped: number;
      happinessScore?: number;
    };
  }>;
}

// Company report response
export interface CompanyReportResponse extends BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    totalCustomers: number;
    totalConversations: number;
    teamMembers: number;
    avgConversationsPerCustomer: number;
    avgRepliesPerConversation: number;
  };
  topCustomers?: Array<{
    id: string;
    name: string;
    email: string;
    conversationCount: number;
  }>;
}

// Happiness report response
export interface HappinessReportResponse extends BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    happinessScore: number;
    totalRatings: number;
    greatCount: number;
    okayCount: number;
    badCount: number;
  };
  ratings?: Array<{
    id: string;
    rating: 'great' | 'ok' | 'not-good';
    customerName: string;
    customerEmail: string;
    conversationId: string;
    comments?: string;
    createdAt: string;
  }>;
}

// Docs report response
export interface DocsReportResponse {
  current: {
    visitors: number;
    browseAction: number;
    sentAnEmailResult: number;
    foundAnAnswerResult: number;
    searchAction: number;
    failedResult: number;
    docsViewedPerVisit: number;
  };
  popularSearches?: Array<{
    count: number;
    id: string;
    results: number;
  }>;
  failedSearches?: Array<{
    count: number;
    id: string;
  }>;
  topArticles?: Array<{
    count: number;
    name: string;
    siteId: string;
    id: string;
    collectionId: string;
  }>;
  topCategories?: Array<{
    count: number;
    name: string;
    siteId: string;
    id: string;
    articles: number;
  }>;
  deltas?: {
    failedResult: number;
    docsViewedPerVisit: number;
    foundAnAnswerResult: number;
    visitors: number;
    browseAction: number;
    searchAction: number;
    sentAnEmailResult: number;
  };
}

export interface TopArticle {
  id: string;
  title: string;
  collectionId: string;
  collectionName?: string;
  siteId?: string;
  siteName?: string;
  views: number;
  visitors: number;
  avgTimeOnPage?: number;
  bounceRate?: number;
  url?: string;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
}

export class ReportsToolHandler extends Injectable {
  constructor(container?: ServiceContainer) {
    super(container);
  }

  /**
   * List all Reports-related tools
   */
  async listReportsTools(): Promise<Tool[]> {
    return [
      {
        name: 'getTopArticles',
        description: 'Get the most viewed Help Scout Docs articles sorted by popularity using the Docs API. Works with all Help Scout plans that have Docs enabled.',
        inputSchema: {
          type: 'object',
          properties: {
            sites: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific site IDs',
            },
            collections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific collection IDs',
            },
            limit: {
              type: 'number',
              minimum: 1,
              maximum: REPORTS_TOOL_CONSTANTS.MAX_LIMIT,
              default: REPORTS_TOOL_CONSTANTS.DEFAULT_LIMIT,
              description: `Number of top articles to return (max ${REPORTS_TOOL_CONSTANTS.MAX_LIMIT})`,
            },
            includeStats: {
              type: 'boolean',
              default: true,
              description: 'Include detailed statistics for each article',
            },
          },
        },
      },
      {
        name: 'getChatReport',
        description: 'Get Help Scout chat conversation analytics report with volume, response times, and resolution metrics. Requires Plus or Pro plan.',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for the report period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date for the report period (ISO 8601)',
            },
            previousStart: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for comparison period (ISO 8601)',
            },
            previousEnd: {
              type: 'string',
              format: 'date-time',
              description: 'End date for comparison period (ISO 8601)',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific mailbox IDs',
            },
            folders: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific folder IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific tag IDs',
            },
            viewBy: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              description: 'Group results by time period',
            },
          },
          required: ['start', 'end'],
        },
      },
      {
        name: 'getEmailReport',
        description: 'Get Help Scout email conversation analytics report with volume, response times, and resolution metrics. Requires Plus or Pro plan.',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for the report period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date for the report period (ISO 8601)',
            },
            previousStart: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for comparison period (ISO 8601)',
            },
            previousEnd: {
              type: 'string',
              format: 'date-time',
              description: 'End date for comparison period (ISO 8601)',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific mailbox IDs',
            },
            folders: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific folder IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific tag IDs',
            },
            viewBy: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              description: 'Group results by time period',
            },
          },
          required: ['start', 'end'],
        },
      },
      {
        name: 'getPhoneReport',
        description: 'Get Help Scout phone conversation analytics report with call volume and duration metrics. Requires Plus or Pro plan.',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for the report period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date for the report period (ISO 8601)',
            },
            previousStart: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for comparison period (ISO 8601)',
            },
            previousEnd: {
              type: 'string',
              format: 'date-time',
              description: 'End date for comparison period (ISO 8601)',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific mailbox IDs',
            },
            folders: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific folder IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific tag IDs',
            },
            viewBy: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              description: 'Group results by time period',
            },
          },
          required: ['start', 'end'],
        },
      },
      {
        name: 'getUserReport',
        description: 'Get Help Scout user/team performance report with productivity metrics, response times, and happiness scores. Requires Plus or Pro plan.',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for the report period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date for the report period (ISO 8601)',
            },
            previousStart: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for comparison period (ISO 8601)',
            },
            previousEnd: {
              type: 'string',
              format: 'date-time',
              description: 'End date for comparison period (ISO 8601)',
            },
            user: {
              type: 'string',
              description: 'User ID for individual report',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific mailbox IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific tag IDs',
            },
            types: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['email', 'chat', 'phone'],
              },
              description: 'Filter by conversation types',
            },
            viewBy: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              description: 'Group results by time period',
            },
            officeHours: {
              type: 'boolean',
              description: 'Filter by office hours only',
            },
          },
          required: ['start', 'end'],
        },
      },
      {
        name: 'getCompanyReport',
        description: 'Get Help Scout company-wide analytics report with customer volume, conversation metrics, and team performance. Requires Plus or Pro plan.',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for the report period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date for the report period (ISO 8601)',
            },
            previousStart: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for comparison period (ISO 8601)',
            },
            previousEnd: {
              type: 'string',
              format: 'date-time',
              description: 'End date for comparison period (ISO 8601)',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific mailbox IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific tag IDs',
            },
            types: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['email', 'chat', 'phone'],
              },
              description: 'Filter by conversation types',
            },
            viewBy: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              description: 'Group results by time period',
            },
          },
          required: ['start', 'end'],
        },
      },
      {
        name: 'getHappinessReport',
        description: 'Get Help Scout overall happiness report with aggregate satisfaction scores. Requires Plus or Pro plan.',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for the report period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date for the report period (ISO 8601)',
            },
            previousStart: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for comparison period (ISO 8601)',
            },
            previousEnd: {
              type: 'string',
              format: 'date-time',
              description: 'End date for comparison period (ISO 8601)',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific mailbox IDs',
            },
            folders: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific folder IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific tag IDs',
            },
            types: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['email', 'chat', 'phone'],
              },
              description: 'Filter by conversation types',
            },
            rating: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['great', 'ok', 'not-good'],
              },
              description: 'Filter by specific ratings (note: API uses "ok" and "not-good")',
            },
            viewBy: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              description: 'Group results by time period',
            },
          },
          required: ['start', 'end'],
        },
      },
      {
        name: 'getHappinessRatings',
        description: 'Get individual Help Scout happiness ratings with customer feedback and comments. Requires Plus or Pro plan.',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for the report period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date for the report period (ISO 8601)',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific mailbox IDs',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific tag IDs',
            },
            types: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['email', 'chat', 'phone'],
              },
              description: 'Filter by conversation types',
            },
            rating: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['great', 'ok', 'not-good', 'all'],
              },
              description: 'Filter by specific ratings (note: uses ok and not-good instead of okay and bad)',
            },
            page: {
              type: 'number',
              minimum: 1,
              default: 1,
              description: 'Page number for pagination',
            },
            sortField: {
              type: 'string',
              enum: ['rating', 'createdAt', 'modifiedAt'],
              default: 'createdAt',
              description: 'Field to sort by',
            },
            sortOrder: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
              description: 'Sort order',
            },
          },
          required: ['start', 'end'],
        },
      },
      {
        name: 'getDocsReport',
        description: 'Get Help Scout Docs analytics report with article views, visitor metrics, and content updates. Requires Plus or Pro plan with Docs enabled.',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for the report period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date for the report period (ISO 8601)',
            },
            previousStart: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for comparison period (ISO 8601)',
            },
            previousEnd: {
              type: 'string',
              format: 'date-time',
              description: 'End date for comparison period (ISO 8601)',
            },
            sites: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific Docs site IDs',
            },
          },
          required: ['start', 'end'],
        },
      },
    ];
  }

  /**
   * Call a Reports tool
   */
  async callReportsTool(request: CallToolRequest): Promise<CallToolResult> {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    const { logger } = this.services.resolve(['logger']);
    
    logger.info('Reports tool call started', {
      requestId,
      toolName: request.params.name,
      arguments: request.params.arguments,
    });

    try {
      let result: CallToolResult;

      switch (request.params.name) {
        case 'getTopArticles':
          result = await this.getTopArticles(request.params.arguments || {});
          break;
        case 'getChatReport':
          result = await this.getChatReport(request.params.arguments || {});
          break;
        case 'getEmailReport':
          result = await this.getEmailReport(request.params.arguments || {});
          break;
        case 'getPhoneReport':
          result = await this.getPhoneReport(request.params.arguments || {});
          break;
        case 'getUserReport':
          result = await this.getUserReport(request.params.arguments || {});
          break;
        case 'getCompanyReport':
          result = await this.getCompanyReport(request.params.arguments || {});
          break;
        case 'getHappinessReport':
          result = await this.getHappinessReport(request.params.arguments || {});
          break;
        case 'getHappinessRatings':
          result = await this.getHappinessRatings(request.params.arguments || {});
          break;
        case 'getDocsReport':
          result = await this.getDocsReport(request.params.arguments || {});
          break;
        default:
          throw new Error(`Unknown Reports tool: ${request.params.name}`);
      }

      const duration = Date.now() - startTime;
      
      logger.info('Reports tool call completed', {
        requestId,
        toolName: request.params.name,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return createMcpToolError(error, {
        toolName: request.params.name,
        requestId,
        duration,
      });
    }
  }

  private async getTopArticles(args: unknown): Promise<CallToolResult> {
    const input = GetTopArticlesInputSchema.parse(args);
    const { logger, config, helpScoutDocsClient } = this.services.resolve(['logger', 'config', 'helpScoutDocsClient']);

    try {
      // First, check if we have Docs API key
      if (!config.helpscout.docsApiKey) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Docs API key not configured',
                message: 'This tool requires HELPSCOUT_DOCS_API_KEY to be set',
                troubleshooting: [
                  '1. Go to https://secure.helpscout.net/settings/docs/code',
                  '2. Generate a Docs API Key',
                  '3. Set HELPSCOUT_DOCS_API_KEY environment variable'
                ],
              }, null, 2),
            },
          ],
        };
      }

      // We'll need to get articles from collections or sites
      // First, let's get all sites if no specific collections are provided
      const allArticles: any[] = [];
      
      if (input.collections && input.collections.length > 0) {
        // Get articles from specific collections
        for (const collectionId of input.collections) {
          logger.info('Fetching articles from collection', { collectionId });
          const response = await helpScoutDocsClient.get<any>(`/collections/${collectionId}/articles`, {
            page: 1,
            pageSize: 100,
            sort: 'popularity',
            order: 'desc',
            status: 'published',
          });
          
          if (response.items) {
            allArticles.push(...response.items);
          }
        }
      } else if (input.sites && input.sites.length > 0) {
        // Get articles from specific sites
        for (const siteId of input.sites) {
          // First get collections for the site
          logger.info('Fetching collections for site', { siteId });
          const collectionsResponse = await helpScoutDocsClient.get<any>(`/collections`, {
            siteId,
            page: 1,
            pageSize: 100,
          });
          
          // Then get articles from each collection
          if (collectionsResponse.items) {
            for (const collection of collectionsResponse.items) {
              logger.info('Fetching articles from collection', { collectionId: collection.id, siteId });
              const articlesResponse = await helpScoutDocsClient.get<any>(`/collections/${collection.id}/articles`, {
                page: 1,
                pageSize: 100,
                sort: 'popularity',
                order: 'desc',
                status: 'published',
              });
              
              if (articlesResponse.items) {
                allArticles.push(...articlesResponse.items);
              }
            }
          }
        }
      } else {
        // No specific collections or sites provided, get from all sites
        logger.info('Fetching all sites');
        const sitesResponse = await helpScoutDocsClient.get<any>('/sites', { page: 1 });
        
        if (sitesResponse.items) {
          for (const site of sitesResponse.items) {
            // Get collections for each site
            const collectionsResponse = await helpScoutDocsClient.get<any>(`/collections`, {
              siteId: site.id,
              page: 1,
              pageSize: 100,
            });
            
            if (collectionsResponse.items) {
              for (const collection of collectionsResponse.items) {
                logger.info('Fetching articles from collection', { collectionId: collection.id, siteId: site.id });
                const articlesResponse = await helpScoutDocsClient.get<any>(`/collections/${collection.id}/articles`, {
                  page: 1,
                  pageSize: 100,
                  sort: 'popularity',
                  order: 'desc',
                  status: 'published',
                });
                
                if (articlesResponse.items) {
                  allArticles.push(...articlesResponse.items);
                }
              }
            }
          }
        }
      }

      // Sort all articles by viewCount/popularity and get top N
      const sortedArticles = allArticles
        .sort((a: any, b: any) => (b.viewCount || b.popularity || 0) - (a.viewCount || a.popularity || 0))
        .slice(0, input.limit);

      // Check if we found any articles
      if (sortedArticles.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'No articles found',
                troubleshooting: [
                  'No published articles exist in the specified collections/sites',
                  'All articles have zero views',
                  'Check if the collection/site IDs are correct'
                ],
                alternativeTools: [
                  'Use "listDocsSites" to see available sites',
                  'Use "listDocsCollections" to see available collections',
                  'Use "getTopDocsArticles" with natural language queries'
                ],
              }, null, 2),
            },
          ],
        };
      }

      // Format the response using Docs API structure
      const topArticles: TopArticle[] = sortedArticles.map((article: any) => ({
        id: article.id,
        title: article.name,
        collectionId: article.collectionId,
        collectionName: '', // Not available in article ref
        siteId: '', // Not available in article ref
        siteName: '', // Not available in article ref
        views: article.viewCount || article.popularity || 0,
        visitors: 0, // Not available in Docs API
        avgTimeOnPage: 0, // Not available in Docs API
        bounceRate: 0, // Not available in Docs API
        url: article.publicUrl,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        lastViewedAt: '', // Not available in Docs API
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalArticles: sortedArticles.length,
              topArticles: input.includeStats ? topArticles : topArticles.map(a => ({
                id: a.id,
                title: a.title,
                views: a.views,
                url: a.url,
              })),
              summary: {
                totalViews: topArticles.reduce((sum, a) => sum + a.views, 0),
                avgViews: Math.round(topArticles.reduce((sum, a) => sum + a.views, 0) / topArticles.length),
                mostViewed: topArticles[0] ? {
                  title: topArticles[0].title,
                  views: topArticles[0].views,
                } : null,
              },
              filters: {
                sites: input.sites,
                collections: input.collections,
              },
              note: 'Data from Help Scout Docs API sorted by popularity (view count)'
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Docs API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch articles',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Check if HELPSCOUT_DOCS_API_KEY is set correctly',
                'Verify the collection/site IDs are valid',
                'Ensure you have at least one Docs site configured'
              ],
              alternativeTools: [
                'Use "getTopDocsArticles" for natural language queries',
                'Use "listDocsSites" to see available sites',
                'Use "listDocsCollections" to see available collections'
              ],
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getDocsReport(args: unknown): Promise<CallToolResult> {
    const input = GetDocsReportInputSchema.parse(args);
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
        resolution: 'day',
      };

      if (input.previousStart && input.previousEnd) {
        params.previousStart = input.previousStart;
        params.previousEnd = input.previousEnd;
      }

      if (input.sites && input.sites.length > 0) {
        params.sites = input.sites.join(',');
      }

      logger.info('Calling Help Scout Reports API for Docs report', { endpoint: '/v2/reports/docs', params });
      
      let response: any;
      try {
        response = await reportsApiClient.getReport<DocsReportResponse>('/v2/reports/docs', params);
      } catch (error: any) {
        logger.error('Failed to get docs report', { error: error.message });
        response = null;
      }
      
      // Check if we got a valid response
      if (!response || response === 'Unknown URL' || (typeof response === 'string') || !response.current) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Docs Reports endpoint not found',
                message: 'The Help Scout API returned "Unknown URL" for the /v2/reports/docs endpoint.',
                details: 'This endpoint may not be available in the current Help Scout API version.',
                troubleshooting: [
                  '1. The Docs Reports endpoint (/v2/reports/docs) may not exist in the Help Scout API',
                  '2. Your Help Scout plan may not include Docs Reports (requires Plus or Pro plan)',
                  '3. This specific report type might have been deprecated or not yet implemented',
                  '4. Try using other report endpoints like getEmailReport, getChatReport, or getHappinessReport instead'
                ],
                alternativeTools: [
                  'Use "getTopArticles" to get popular articles using the Docs API',
                  'Use "getTopDocsArticles" for natural language queries',
                  'Contact Help Scout support to enable Reports API access'
                ],
                requestedFilters: {
                  start: input.start,
                  end: input.end,
                  sites: input.sites,
                },
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              report: response,
              filters: {
                sites: input.sites,
              },
              period: {
                start: input.start,
                end: input.end,
                ...(input.previousStart && { previousStart: input.previousStart }),
                ...(input.previousEnd && { previousEnd: input.previousEnd }),
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Docs Reports API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch Docs report',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Verify your Help Scout plan includes Reports API access (Plus/Pro required)',
                'Check if your OAuth token has Reports permissions',
                'Ensure the date range is valid (start < end)',
                'Try using "getTopArticles" as an alternative'
              ],
              requestedFilters: {
                start: input.start,
                end: input.end,
                sites: input.sites,
              },
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getChatReport(args: unknown): Promise<CallToolResult> {
    const input = GetConversationReportInputSchema.parse(args);
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
      };

      if (input.previousStart && input.previousEnd) {
        params.previousStart = input.previousStart;
        params.previousEnd = input.previousEnd;
      }

      if (input.mailboxes && input.mailboxes.length > 0) {
        params.mailboxes = input.mailboxes.join(',');
      }

      if (input.folders && input.folders.length > 0) {
        params.folders = input.folders.join(',');
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      if (input.viewBy) {
        params.viewBy = input.viewBy;
      }

      logger.info('Calling Help Scout Reports API for Chat report', { endpoint: '/v2/reports/chat', params });
      const response = await reportsApiClient.getReport<ConversationReportResponse>('/v2/reports/chat', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              report: response,
              filters: {
                mailboxes: input.mailboxes,
                folders: input.folders,
                tags: input.tags,
                viewBy: input.viewBy,
              },
              period: {
                start: input.start,
                end: input.end,
                ...(input.previousStart && { previousStart: input.previousStart }),
                ...(input.previousEnd && { previousEnd: input.previousEnd }),
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Chat Reports API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch Chat report',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Verify your Help Scout plan includes Reports API access (Plus/Pro required)',
                'Check if your OAuth token has Reports permissions',
                'Ensure the date range is valid (start < end)',
                'Verify chat is enabled for your mailboxes'
              ],
              requestedFilters: {
                start: input.start,
                end: input.end,
                mailboxes: input.mailboxes,
                folders: input.folders,
                tags: input.tags,
              },
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getEmailReport(args: unknown): Promise<CallToolResult> {
    const input = GetConversationReportInputSchema.parse(args);
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
      };

      if (input.previousStart && input.previousEnd) {
        params.previousStart = input.previousStart;
        params.previousEnd = input.previousEnd;
      }

      if (input.mailboxes && input.mailboxes.length > 0) {
        params.mailboxes = input.mailboxes.join(',');
      }

      if (input.folders && input.folders.length > 0) {
        params.folders = input.folders.join(',');
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      if (input.viewBy) {
        params.viewBy = input.viewBy;
      }

      logger.info('Calling Help Scout Reports API for Email report', { endpoint: '/v2/reports/email', params });
      const response = await reportsApiClient.getReport<ConversationReportResponse>('/v2/reports/email', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              report: response,
              filters: {
                mailboxes: input.mailboxes,
                folders: input.folders,
                tags: input.tags,
                viewBy: input.viewBy,
              },
              period: {
                start: input.start,
                end: input.end,
                ...(input.previousStart && { previousStart: input.previousStart }),
                ...(input.previousEnd && { previousEnd: input.previousEnd }),
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Email Reports API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch Email report',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Verify your Help Scout plan includes Reports API access (Plus/Pro required)',
                'Check if your OAuth token has Reports permissions',
                'Ensure the date range is valid (start < end)',
                'Email reports are available for all Help Scout accounts'
              ],
              requestedFilters: {
                start: input.start,
                end: input.end,
                mailboxes: input.mailboxes,
                folders: input.folders,
                tags: input.tags,
              },
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getPhoneReport(args: unknown): Promise<CallToolResult> {
    const input = GetConversationReportInputSchema.parse(args);
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
      };

      if (input.previousStart && input.previousEnd) {
        params.previousStart = input.previousStart;
        params.previousEnd = input.previousEnd;
      }

      if (input.mailboxes && input.mailboxes.length > 0) {
        params.mailboxes = input.mailboxes.join(',');
      }

      if (input.folders && input.folders.length > 0) {
        params.folders = input.folders.join(',');
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      if (input.viewBy) {
        params.viewBy = input.viewBy;
      }

      logger.info('Calling Help Scout Reports API for Phone report', { endpoint: '/v2/reports/phone', params });
      const response = await reportsApiClient.getReport<ConversationReportResponse>('/v2/reports/phone', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              report: response,
              filters: {
                mailboxes: input.mailboxes,
                folders: input.folders,
                tags: input.tags,
                viewBy: input.viewBy,
              },
              period: {
                start: input.start,
                end: input.end,
                ...(input.previousStart && { previousStart: input.previousStart }),
                ...(input.previousEnd && { previousEnd: input.previousEnd }),
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Phone Reports API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch Phone report',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Verify your Help Scout plan includes Reports API access (Plus/Pro required)',
                'Check if your OAuth token has Reports permissions',
                'Ensure the date range is valid (start < end)',
                'Verify phone support is enabled for your mailboxes'
              ],
              requestedFilters: {
                start: input.start,
                end: input.end,
                mailboxes: input.mailboxes,
                folders: input.folders,
                tags: input.tags,
              },
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getUserReport(args: unknown): Promise<CallToolResult> {
    const input = GetUserReportInputSchema.parse(args);
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
      };

      if (input.previousStart && input.previousEnd) {
        params.previousStart = input.previousStart;
        params.previousEnd = input.previousEnd;
      }

      if (input.user) {
        params.user = input.user;
      }

      if (input.mailboxes && input.mailboxes.length > 0) {
        params.mailboxes = input.mailboxes.join(',');
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      if (input.types && input.types.length > 0) {
        params.types = input.types.join(',');
      }

      if (input.viewBy) {
        params.viewBy = input.viewBy;
      }

      if (input.officeHours !== undefined) {
        params.officeHours = input.officeHours;
      }

      logger.info('Calling Help Scout Reports API for User report', { endpoint: '/v2/reports/user', params });
      const response = await reportsApiClient.getReport<UserReportResponse>('/v2/reports/user', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              report: response,
              filters: {
                user: input.user,
                mailboxes: input.mailboxes,
                tags: input.tags,
                types: input.types,
                viewBy: input.viewBy,
                officeHours: input.officeHours,
              },
              period: {
                start: input.start,
                end: input.end,
                ...(input.previousStart && { previousStart: input.previousStart }),
                ...(input.previousEnd && { previousEnd: input.previousEnd }),
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('User Reports API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch User report',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Verify your Help Scout plan includes Reports API access (Plus/Pro required)',
                'Standard plan Account Owners can add access via an add-on',
                'Check if your OAuth token has Reports permissions',
                'Ensure the date range is valid (start < end)',
                'If user ID is provided, verify it exists and is active'
              ],
              requestedFilters: {
                start: input.start,
                end: input.end,
                user: input.user,
                mailboxes: input.mailboxes,
                tags: input.tags,
                types: input.types,
              },
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getCompanyReport(args: unknown): Promise<CallToolResult> {
    const input = GetCompanyReportInputSchema.parse(args);
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
      };

      if (input.previousStart && input.previousEnd) {
        params.previousStart = input.previousStart;
        params.previousEnd = input.previousEnd;
      }

      if (input.mailboxes && input.mailboxes.length > 0) {
        params.mailboxes = input.mailboxes.join(',');
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      if (input.types && input.types.length > 0) {
        params.types = input.types.join(',');
      }

      if (input.viewBy) {
        params.viewBy = input.viewBy;
      }

      logger.info('Calling Help Scout Reports API for Company report', { endpoint: '/v2/reports/company', params });
      const response = await reportsApiClient.getReport<CompanyReportResponse>('/v2/reports/company', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              report: response,
              filters: {
                mailboxes: input.mailboxes,
                tags: input.tags,
                types: input.types,
                viewBy: input.viewBy,
              },
              period: {
                start: input.start,
                end: input.end,
                ...(input.previousStart && { previousStart: input.previousStart }),
                ...(input.previousEnd && { previousEnd: input.previousEnd }),
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Company Reports API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch Company report',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Verify your Help Scout plan includes Reports API access (Plus/Pro required)',
                'Check if your OAuth token has Reports permissions',
                'Ensure the date range is valid (start < end)',
                'Company reports provide organization-wide metrics'
              ],
              requestedFilters: {
                start: input.start,
                end: input.end,
                mailboxes: input.mailboxes,
                tags: input.tags,
                types: input.types,
              },
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getHappinessReport(args: unknown): Promise<CallToolResult> {
    const input = GetHappinessReportInputSchema.parse(args);
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
      };

      if (input.previousStart && input.previousEnd) {
        params.previousStart = input.previousStart;
        params.previousEnd = input.previousEnd;
      }

      if (input.mailboxes && input.mailboxes.length > 0) {
        params.mailboxes = input.mailboxes.join(',');
      }

      if (input.folders && input.folders.length > 0) {
        params.folders = input.folders.join(',');
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      if (input.types && input.types.length > 0) {
        params.types = input.types.join(',');
      }

      if (input.rating && input.rating.length > 0) {
        params.rating = input.rating.join(',');
      }

      if (input.viewBy) {
        params.viewBy = input.viewBy;
      }

      // The happiness report endpoint - overall statistics
      logger.info('Calling Help Scout Reports API for Happiness report', { endpoint: '/v2/reports/happiness', params });
      const response = await reportsApiClient.getReport<HappinessReportResponse>('/v2/reports/happiness', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              report: response,
              filters: {
                mailboxes: input.mailboxes,
                folders: input.folders,
                tags: input.tags,
                types: input.types,
                rating: input.rating,
                viewBy: input.viewBy,
              },
              period: {
                start: input.start,
                end: input.end,
                ...(input.previousStart && { previousStart: input.previousStart }),
                ...(input.previousEnd && { previousEnd: input.previousEnd }),
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Happiness Reports API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch Happiness report',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Verify your Help Scout plan includes Reports API access (Plus/Pro required)',
                'Check if your OAuth token has Reports permissions',
                'Ensure the date range is valid (start < end)',
                'Happiness ratings must be enabled in your account settings'
              ],
              requestedFilters: {
                start: input.start,
                end: input.end,
                mailboxes: input.mailboxes,
                folders: input.folders,
                tags: input.tags,
                types: input.types,
                rating: input.rating,
              },
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getHappinessRatings(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
      mailboxes: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      types: z.array(z.enum(['email', 'chat', 'phone'])).optional(),
      rating: z.array(z.enum(['great', 'ok', 'not-good', 'all'])).optional(),
      page: z.number().min(1).default(1),
      sortField: z.enum(['rating', 'createdAt', 'modifiedAt']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }).parse(args);
    
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
        page: input.page,
        sortField: input.sortField,
        sortOrder: input.sortOrder,
      };

      if (input.mailboxes && input.mailboxes.length > 0) {
        params.mailboxes = input.mailboxes.join(',');
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      if (input.types && input.types.length > 0) {
        params.types = input.types.join(',');
      }

      if (input.rating && input.rating.length > 0) {
        params.rating = input.rating.join(',');
      }

      // The happiness ratings endpoint for individual ratings
      logger.info('Calling Help Scout Reports API for Happiness ratings', { endpoint: '/v2/reports/happiness/ratings', params });
      const response = await reportsApiClient.getReport<any>('/v2/reports/happiness/ratings', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ratings: response,
              filters: {
                mailboxes: input.mailboxes,
                tags: input.tags,
                types: input.types,
                rating: input.rating,
              },
              period: {
                start: input.start,
                end: input.end,
              },
              pagination: {
                page: input.page,
                sortField: input.sortField,
                sortOrder: input.sortOrder,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Happiness Ratings API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch Happiness ratings',
              message: error instanceof Error ? error.message : String(error),
              troubleshooting: [
                'Verify your Help Scout plan includes Reports API access (Plus/Pro required)',
                'Check if your OAuth token has Reports permissions',
                'Ensure the date range is valid (start < end)',
                'Happiness ratings must be enabled in your account settings',
                'Note: rating values are "great", "ok", "not-good" (not "okay" or "bad")'
              ],
              requestedFilters: {
                start: input.start,
                end: input.end,
                mailboxes: input.mailboxes,
                tags: input.tags,
                types: input.types,
                rating: input.rating,
              },
            }, null, 2),
          },
        ],
      };
    }
  }
}