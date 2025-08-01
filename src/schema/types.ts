import { z } from 'zod';

// Help Scout API Types
export const InboxSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ConversationSchema = z.object({
  id: z.number(),
  number: z.number(),
  subject: z.string(),
  status: z.enum(['active', 'pending', 'closed', 'spam']),
  state: z.enum(['published', 'draft']),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string().nullable(),
  assignee: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).nullable(),
  customer: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
  mailbox: z.object({
    id: z.number(),
    name: z.string(),
  }),
  tags: z.array(z.object({
    id: z.number(),
    name: z.string(),
    color: z.string(),
  })),
  threads: z.number(),
});

export const ThreadSchema = z.object({
  id: z.number(),
  type: z.enum(['customer', 'note', 'lineitem', 'phone', 'message']),
  status: z.enum(['active', 'pending', 'closed', 'spam']),
  state: z.enum(['published', 'draft', 'hidden']),
  action: z.object({
    type: z.string(),
    text: z.string(),
  }).nullable(),
  body: z.string(),
  source: z.object({
    type: z.string(),
    via: z.string(),
  }),
  customer: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).nullable(),
  createdBy: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).nullable(),
  assignedTo: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// MCP Tool Input Schemas
export const SearchInboxesInputSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const SearchConversationsInputSchema = z.object({
  query: z.string().optional(),
  inboxId: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(['active', 'pending', 'closed', 'spam']).optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'number']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  fields: z.array(z.string()).optional(),
});

export const GetThreadsInputSchema = z.object({
  conversationId: z.string(),
  limit: z.number().min(1).max(200).default(200),
  cursor: z.string().optional(),
});

export const GetConversationSummaryInputSchema = z.object({
  conversationId: z.string(),
});

export const AdvancedConversationSearchInputSchema = z.object({
  contentTerms: z.array(z.string()).optional(),
  subjectTerms: z.array(z.string()).optional(),
  customerEmail: z.string().optional(),
  emailDomain: z.string().optional(),
  tags: z.array(z.string()).optional(),
  inboxId: z.string().optional(),
  status: z.enum(['active', 'pending', 'closed', 'spam']).optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

export const MultiStatusConversationSearchInputSchema = z.object({
  searchTerms: z.array(z.string()).min(1, 'At least one search term is required'),
  inboxId: z.string().optional(),
  statuses: z.array(z.enum(['active', 'pending', 'closed', 'spam'])).default(['active', 'pending', 'closed']),
  searchIn: z.array(z.enum(['body', 'subject', 'both'])).default(['both']),
  timeframeDays: z.number().min(1).max(365).default(60),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  limitPerStatus: z.number().min(1).max(100).default(25),
  includeVariations: z.boolean().default(true),
});

// Response Types
export const ServerTimeSchema = z.object({
  isoTime: z.string(),
  unixTime: z.number(),
});

export const ErrorSchema = z.object({
  code: z.enum(['INVALID_INPUT', 'NOT_FOUND', 'UNAUTHORIZED', 'RATE_LIMIT', 'UPSTREAM_ERROR']),
  message: z.string(),
  retryAfter: z.number().optional(),
  details: z.record(z.unknown()).default({}),
});

// Type exports
export type Inbox = z.infer<typeof InboxSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type SearchInboxesInput = z.infer<typeof SearchInboxesInputSchema>;
export type SearchConversationsInput = z.infer<typeof SearchConversationsInputSchema>;
export type GetThreadsInput = z.infer<typeof GetThreadsInputSchema>;
export type GetConversationSummaryInput = z.infer<typeof GetConversationSummaryInputSchema>;
export type AdvancedConversationSearchInput = z.infer<typeof AdvancedConversationSearchInputSchema>;
export type MultiStatusConversationSearchInput = z.infer<typeof MultiStatusConversationSearchInputSchema>;
export type ServerTime = z.infer<typeof ServerTimeSchema>;
export type ApiError = z.infer<typeof ErrorSchema>;

// Help Scout Docs API Types
export const DocsSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  subdomain: z.string(),
  cname: z.string().nullable(),
  hasPublicSite: z.boolean(),
  redirDomain: z.string().nullable(),
  autoSaveDrafts: z.boolean(),
  logoUrl: z.string().nullable(),
  logoWidth: z.string().nullable(),
  logoHeight: z.string().nullable(),
  status: z.string(),
  createdBy: z.number(),
  updatedBy: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const DocsCollectionSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  number: z.number(),
  slug: z.string(),
  visibility: z.enum(['public', 'private']),
  order: z.number(),
  name: z.string(),
  description: z.string(),
  publicUrl: z.string(),
  articleCount: z.number(),
  publishedArticleCount: z.number(),
  createdBy: z.number(),
  updatedBy: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const DocsCategorySchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  number: z.number(),
  slug: z.string(),
  visibility: z.enum(['public', 'private']),
  order: z.number(),
  name: z.string(),
  description: z.string(),
  publicUrl: z.string(),
  articleCount: z.number(),
  publishedArticleCount: z.number(),
  createdBy: z.number(),
  updatedBy: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const DocsArticleRefSchema = z.object({
  id: z.string(),
  number: z.number(),
  collectionId: z.string(),
  status: z.string(),
  hasDraft: z.boolean(),
  name: z.string(),
  publicUrl: z.string(),
  popularity: z.number(),
  viewCount: z.number(),
  createdBy: z.number(),
  updatedBy: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const DocsArticleSchema = z.object({
  id: z.string(),
  number: z.number(),
  collectionId: z.string(),
  slug: z.string(),
  status: z.string(),
  hasDraft: z.boolean(),
  name: z.string(),
  text: z.string(),
  categories: z.array(z.string()),
  related: z.array(z.string()),
  publicUrl: z.string(),
  popularity: z.number(),
  viewCount: z.number(),
  createdBy: z.number(),
  updatedBy: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

// Docs API Input Schemas
export const ListDocsSitesInputSchema = z.object({
  page: z.number().min(1).default(1),
});

export const ListDocsCollectionsInputSchema = z.object({
  page: z.number().min(1).default(1),
  siteId: z.string().optional(),
  visibility: z.enum(['all', 'public', 'private']).default('all'),
  sort: z.enum(['number', 'visibility', 'order', 'name', 'createdAt', 'updatedAt']).default('order'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const ListDocsCategoriesInputSchema = z.object({
  collectionId: z.string(),
  page: z.number().min(1).default(1),
  sort: z.enum(['number', 'order', 'name', 'articleCount', 'createdAt', 'updatedAt']).default('order'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const ListDocsArticlesInputSchema = z.object({
  collectionId: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.number().min(1).default(1),
  status: z.enum(['all', 'published', 'notpublished']).default('all'),
  sort: z.enum(['number', 'status', 'name', 'popularity', 'createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  pageSize: z.number().min(1).max(100).default(50),
});

export const GetDocsArticleInputSchema = z.object({
  articleId: z.string(),
  draft: z.boolean().default(false),
});

export const UpdateDocsArticleInputSchema = z.object({
  articleId: z.string(),
  name: z.string().optional(),
  text: z.string().optional(),
  status: z.string().optional(),
  categories: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
});

export const UpdateDocsCollectionInputSchema = z.object({
  collectionId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']).optional(),
  order: z.number().optional(),
});

export const UpdateDocsCategoryInputSchema = z.object({
  categoryId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']).optional(),
  order: z.number().optional(),
});

// Type exports
export type DocsSite = z.infer<typeof DocsSiteSchema>;
export type DocsCollection = z.infer<typeof DocsCollectionSchema>;
export type DocsCategory = z.infer<typeof DocsCategorySchema>;
export type DocsArticleRef = z.infer<typeof DocsArticleRefSchema>;
export type DocsArticle = z.infer<typeof DocsArticleSchema>;
export type ListDocsSitesInput = z.infer<typeof ListDocsSitesInputSchema>;
export type ListDocsCollectionsInput = z.infer<typeof ListDocsCollectionsInputSchema>;
export type ListDocsCategoriesInput = z.infer<typeof ListDocsCategoriesInputSchema>;
export type ListDocsArticlesInput = z.infer<typeof ListDocsArticlesInputSchema>;
export type GetDocsArticleInput = z.infer<typeof GetDocsArticleInputSchema>;
export type UpdateDocsArticleInput = z.infer<typeof UpdateDocsArticleInputSchema>;
export type UpdateDocsCollectionInput = z.infer<typeof UpdateDocsCollectionInputSchema>;
export type UpdateDocsCategoryInput = z.infer<typeof UpdateDocsCategoryInputSchema>;