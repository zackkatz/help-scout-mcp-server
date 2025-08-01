# Help Scout MCP Server

[![npm version](https://badge.fury.io/js/help-scout-mcp-server.svg)](https://badge.fury.io/js/help-scout-mcp-server)
[![Docker](https://img.shields.io/docker/v/zackkatz/help-scout-mcp-server?logo=docker&label=docker)](https://hub.docker.com/r/zackkatz/help-scout-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)

> **Help Scout MCP Server** - Connect Claude and other AI assistants to your Help Scout data with enterprise-grade security and advanced search capabilities.

> **Note**: This is a fork of the original [help-scout-mcp-server](https://github.com/drewburchfield/help-scout-mcp-server) by Drew Burchfield.

## 📖 Table of Contents

- [🎉 What's New](#-whats-new-in-v120)
- [⚡ Quick Start](#quick-start)
- [🔑 API Credentials](#getting-your-api-credentials)
- [🛠️ Tools & Capabilities](#tools--capabilities)
- [⚙️ Configuration](#configuration-options)
- [🔍 Troubleshooting](#troubleshooting)
- [🤝 Contributing](#contributing)

## 🎉 What's New in v1.3.0

- **📚 Full Docs API Integration**: Complete support for Help Scout Docs API
  - Browse and search documentation sites, collections, categories, and articles
  - Read full article content with PII protection
  - Update articles, collections, and categories (with safety controls)
- **📈 Complete Reports API**: All Help Scout Reports endpoints implemented
  - Conversation reports (chat, email, phone) with detailed metrics
  - User/team performance reports with productivity analytics
  - Company-wide reports with customer and team insights
  - Happiness reports with satisfaction scores and feedback
  - Docs analytics with article views and visitor metrics
- **🎯 DXT Extension**: One-click installation for Claude Desktop
- **🔧 Clear Environment Variables**: `HELPSCOUT_CLIENT_ID` and `HELPSCOUT_CLIENT_SECRET`
- **⚡ Connection Pooling**: Improved performance with HTTP connection reuse
- **🛡️ Enhanced Security**: Comprehensive input validation and API constraints
- **🔄 Dependency Injection**: Cleaner architecture with ServiceContainer
- **🧪 Comprehensive Testing**: 69%+ branch coverage with reliable tests

## Prerequisites

- **Node.js 18+** (for command line usage)
- **Help Scout Account** with API access
- **OAuth2 App** or **Personal Access Token** from Help Scout
- **Claude Desktop** (for DXT installation) or any MCP-compatible client

> **Note**: The DXT extension includes Node.js, so no local installation needed for Claude Desktop users.

## Quick Start

### 🎯 Option 1: Claude Desktop (DXT One-Click Install)

**Easiest setup using [DXT (Desktop Extensions)](https://docs.anthropic.com/en/docs/build-with-claude/computer-use#desktop-extensions) - no configuration needed:**

1. Download the latest [`.dxt` file from releases](https://github.com/zackkatz/help-scout-mcp-server/releases)
2. Double-click to install in Claude Desktop
3. Enter your Help Scout OAuth2 Client ID and Client Secret when prompted
4. Start using immediately!

### 📋 Option 2: Claude Desktop (Manual Config)

```json
{
  "mcpServers": {
    "helpscout": {
      "command": "npx",
      "args": ["help-scout-mcp-server"],
      "env": {
        "HELPSCOUT_CLIENT_ID": "your-client-id",
        "HELPSCOUT_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### 🐳 Option 3: Docker

```bash
docker run -e HELPSCOUT_CLIENT_ID="your-client-id" \
  -e HELPSCOUT_CLIENT_SECRET="your-client-secret" \
  zackkatz/help-scout-mcp-server
```

### 💻 Option 4: Command Line

```bash
HELPSCOUT_CLIENT_ID="your-client-id" \
HELPSCOUT_CLIENT_SECRET="your-client-secret" \
npx help-scout-mcp-server
```

## Getting Your API Credentials

### 🎯 **Recommended: OAuth2 Client Credentials (Step-by-Step)**

This method is recommended for production use and provides automatic token refresh.

**Why Client Credentials?** MCP servers are backend applications that run without user interaction. We use the Client Credentials flow (not Authorization Code flow) because:
- ✅ No browser or user login required
- ✅ Perfect for server-to-server authentication
- ✅ Automatic token refresh
- ✅ Works with Claude Desktop, Continue.dev, etc.

#### Step 1: Create a Private App
1. Log in to your Help Scout account
2. Click your profile icon (top right) → **My Apps**
3. Click **Create My App**
4. Fill out the form:
   - **App Name**: e.g., "Help Scout MCP Server"
   - **Redirection URL**: Not needed for server-side apps (leave blank)
   - **Description**: Optional description of your integration

#### Step 2: Configure App Permissions
Select the scopes your app needs:
- ✅ **Mailbox** - Read conversations, threads, and mailbox data
- ✅ **Customers** - Access customer information
- ✅ **Reports** - Access analytics and reporting (Plus/Pro plans only)
- ✅ **Users** - Read user information
- ✅ **Webhooks** - If you need webhook functionality

**Note**: Only select the scopes you actually need for security best practices.

#### Step 3: Save and Get Credentials
1. Click **Create Application**
2. You'll see your credentials:
   - **App ID** (this is your Client ID)
   - **App Secret** (this is your Client Secret)
3. **⚠️ Important**: Copy these immediately! The App Secret is only shown once.

#### Step 4: Configure the MCP Server
Set these environment variables:
```bash
export HELPSCOUT_CLIENT_ID="your-app-id-here"
export HELPSCOUT_CLIENT_SECRET="your-app-secret-here"
```

Or add to your `.env` file:
```env
HELPSCOUT_CLIENT_ID=your-app-id-here
HELPSCOUT_CLIENT_SECRET=your-app-secret-here
```

#### Step 5: Test Your Configuration
```bash
# Test with environment variables
HELPSCOUT_CLIENT_ID="your-app-id" \
HELPSCOUT_CLIENT_SECRET="your-app-secret" \
npx help-scout-mcp-server

# Or if using .env file
npx help-scout-mcp-server
```

#### Troubleshooting OAuth Issues
- **"Unknown URL" for Reports**: Ensure your account has a Plus/Pro plan
- **Authentication Failed**: Double-check your Client ID and Secret
- **Missing Scopes**: Go back to My Apps and edit your app's permissions
- **Token Expired**: The server handles refresh automatically

### 🔐 **Alternative: Personal Access Token**

For quick testing or personal use only. These tokens don't auto-refresh.

1. Go to **Help Scout** → **Your Profile** → **Authentication**
2. Under **API Keys**, click **Generate an API Key**
3. Give it a memorable label (e.g., "MCP Server")
4. Copy the generated token
5. Use in configuration: `HELPSCOUT_API_KEY=Bearer your-token-here`

**⚠️ Note**: Personal Access Tokens expire and must be manually regenerated.

### 📚 **For Docs API Access**

1. Go to **[Help Scout Docs Settings](https://secure.helpscout.net/settings/docs/code)**
2. Generate a **Docs API Key**
3. Use in configuration: `HELPSCOUT_DOCS_API_KEY=your-docs-api-key`

**Important Notes:**
- The Docs API key is separate from your main Help Scout API credentials
- Ensure Help Scout Docs is enabled for your account
- You must have at least one Docs site created to access documentation
- Reports API (for analytics) requires Plus/Pro plan

## Features

- **🔍 Advanced Search**: Multi-status conversation search, content filtering, boolean queries
- **📊 Smart Analysis**: Conversation summaries, thread retrieval, inbox monitoring
- **📚 Docs Integration**: Full Help Scout Docs API support for articles, collections, and categories
- **📈 Comprehensive Reports**: All Help Scout Reports API endpoints - chat, email, phone, user, company, happiness, and docs analytics
- **🔒 Enterprise Security**: PII redaction, secure token handling, comprehensive audit logs
- **⚡ High Performance**: Built-in caching, rate limiting, automatic retry logic
- **🎯 Easy Integration**: Works with Claude Desktop, Cursor, Continue.dev, and more

## Tools & Capabilities

### Core Search Tools

| Tool | Description | Best For |
|------|-------------|----------|
| `searchConversations` | **⭐ For Listing** - Can omit query to list ALL recent conversations | "Show me recent tickets", browsing conversations |
| `comprehensiveConversationSearch` | **🔍 For Content Search** - Requires search terms, searches all statuses | "Find tickets about billing issues", content-based searches |
| `advancedConversationSearch` | Boolean queries with content/subject/email filtering | Complex search requirements |
| `searchInboxes` | Find inboxes by name | Discovering available inboxes |

### Analysis & Retrieval Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `getConversationSummary` | Customer message + latest staff reply summary | Quick conversation overview |
| `getThreads` | Complete conversation message history | Full context analysis |
| `getServerTime` | Current server timestamp | Time-relative searches |

### Documentation Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `listDocsSites` | List all documentation sites with NLP filtering | Discover available sites |
| `listDocsCollections` | List collections with site NLP resolution | Browse documentation structure |
| `listDocsCategories` | List categories in a collection | Navigate collection organization |
| `listDocsArticlesByCollection` | List articles in a collection (sort by popularity) | Find articles by collection |
| `listDocsArticlesByCategory` | List articles in a category (sort by popularity) | Find articles by category |
| `getDocsArticle` | Get full article content | Read complete documentation |
| `updateDocsArticle` | Update article content/properties | Modify documentation |
| `updateDocsCollection` | Update collection properties | Manage collections |
| `updateDocsCategory` | Update category properties | Manage categories |
| `getTopDocsArticles` | Get most popular articles by views with NLP support | Find most-read documentation |
| `listAllDocsCollections` | List all available collections across sites | Discover available content |
| `getSiteCollections` | Get collections for a specific site using NLP | Find site-specific collections |

### Reports & Analytics Tools

| Tool | Description | Requirements |
|------|-------------|-------------|
| `getTopArticles` | Get top most viewed docs articles sorted by popularity | Works with all plans |
| `getChatReport` | Chat conversation analytics with volume, response times, and resolution metrics | Plus/Pro plan required |
| `getEmailReport` | Email conversation analytics with volume, response times, and resolution metrics | Plus/Pro plan required |
| `getPhoneReport` | Phone conversation analytics with call volume and duration metrics | Plus/Pro plan required |
| `getUserReport` | User/team performance report with productivity metrics and happiness scores | Plus/Pro plan required |
| `getCompanyReport` | Company-wide analytics with customer volume and team performance | Plus/Pro plan required |
| `getHappinessReport` | Customer satisfaction scores and feedback analysis | Plus/Pro plan required |
| `getDocsReport` | Comprehensive docs analytics report with article views and visitor metrics | Plus/Pro plan required |

### Resources

#### Conversations
- `helpscout://inboxes` - List all accessible inboxes
- `helpscout://conversations` - Search conversations with filters
- `helpscout://threads` - Get thread messages for a conversation
- `helpscout://clock` - Current server timestamp

#### Documentation
- `helpscout-docs://sites` - List all documentation sites
- `helpscout-docs://collections` - List collections with filtering
- `helpscout-docs://categories` - List categories in a collection
- `helpscout-docs://articles` - Get articles with full content

## Search Examples

> **📝 Key Distinction**: Use `searchConversations` (without query) for **listing** conversations, use `comprehensiveConversationSearch` (with search terms) for **finding** specific content.

### Listing Recent Conversations
```javascript
// Best for "show me recent tickets" - omit query parameter
searchConversations({
  status: "active",
  limit: 25,
  sort: "createdAt",
  order: "desc"
})
```

### Content-Based Search
```javascript
// Best for "find tickets about X" - requires search terms
comprehensiveConversationSearch({
  searchTerms: ["urgent", "billing"],
  timeframeDays: 60,
  inboxId: "256809"
})
```

### Content-Specific Searches
```javascript
// Search in message bodies and subjects
comprehensiveConversationSearch({
  searchTerms: ["refund", "cancellation"],
  searchIn: ["both"],
  timeframeDays: 30
})

// Customer organization search
advancedConversationSearch({
  emailDomain: "company.com",
  contentTerms: ["integration", "API"],
  status: "active"
})
```

### Help Scout Query Syntax
```javascript
// Advanced query syntax support
searchConversations({
  query: "(body:\"urgent\" OR subject:\"emergency\") AND tag:\"escalated\"",
  status: "active"
})
```

### Documentation Examples
```javascript
// List all documentation sites
listDocsSites({
  page: 1
})

// Get articles in a collection
listDocsArticlesByCollection({
  collectionId: "123456",
  status: "published",
  sort: "popularity"
})

// Get full article content
getDocsArticle({
  articleId: "789012"
})

// Update an article
updateDocsArticle({
  articleId: "789012",
  name: "Updated Article Title",
  text: "<p>New article content</p>"
})
```

### Reports Examples
```javascript
// Get email conversation report with comparison
getEmailReport({
  start: "2024-01-01T00:00:00Z",
  end: "2024-01-31T23:59:59Z",
  previousStart: "2023-12-01T00:00:00Z",
  previousEnd: "2023-12-31T23:59:59Z",
  mailboxes: ["123456"],
  viewBy: "week"
})

// Get user performance report
getUserReport({
  start: "2024-01-01T00:00:00Z",
  end: "2024-01-31T23:59:59Z",
  user: "789012",
  types: ["email", "chat"],
  officeHours: true
})

// Get happiness ratings with filters
getHappinessReport({
  start: "2024-01-01T00:00:00Z",
  end: "2024-01-31T23:59:59Z",
  rating: ["great", "okay"],
  mailboxes: ["123456"],
  viewBy: "day"
})

// Get company-wide analytics
getCompanyReport({
  start: "2024-01-01T00:00:00Z",
  end: "2024-01-31T23:59:59Z",
  viewBy: "month"
})
```

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `HELPSCOUT_CLIENT_ID` | OAuth2 Client ID from Help Scout My Apps | Required |
| `HELPSCOUT_CLIENT_SECRET` | OAuth2 Client Secret from Help Scout My Apps | Required |
| `HELPSCOUT_API_KEY` | Personal Access Token (format: `Bearer token`) | Alternative to OAuth2 |
| `HELPSCOUT_BASE_URL` | Help Scout API endpoint | `https://api.helpscout.net/v2/` |
| `ALLOW_PII` | Include message content in responses | `false` |
| `CACHE_TTL_SECONDS` | Cache duration for API responses | `300` |
| `LOG_LEVEL` | Logging verbosity (`error`, `warn`, `info`, `debug`) | `info` |
| `HELPSCOUT_DOCS_API_KEY` | API key for Help Scout Docs access | Required for Docs |
| `HELPSCOUT_DOCS_BASE_URL` | Help Scout Docs API endpoint | `https://docsapi.helpscout.net/v1/` |
| `HELPSCOUT_DEFAULT_DOCS_COLLECTION_ID` | Default collection ID for queries | Optional |
| `HELPSCOUT_DEFAULT_DOCS_SITE_ID` | Default Docs site ID for queries | Optional |
| `HELPSCOUT_ALLOW_DOCS_DELETE` | Enable Docs deletion operations | `false` |


## Smart Site & Collection Resolution

The MCP server includes intelligent natural language processing for Help Scout Docs sites and collections:

### Natural Language Queries

#### Collections
```javascript
// These all work to find GravityKit articles:
getTopDocsArticles({ query: "GravityKit docs" })
getTopDocsArticles({ query: "top GravityKit articles" })
getTopDocsArticles({ query: "What are the most popular GravityKit help articles?" })
```

#### Sites
```javascript
// Natural language site queries:
listDocsCollections({ query: "GravityKit" })  // Find GravityKit site
getSiteCollections({ query: "TrustedLogin site" })  // Get TrustedLogin collections
listDocsSites({ query: "gravity" })  // Find sites matching "gravity"
```

### Matching Algorithm
The system matches sites and collections using:
1. **Direct name match** - Exact site/collection name (100% confidence)
2. **Company/Site name match** - Company name like "GravityKit" (80-90% confidence)
3. **Subdomain match** - Matches subdomain patterns (70-80% confidence)
4. **CNAME match** - Custom domain matching (70% confidence)
5. **Partial word match** - Intelligent fuzzy matching (variable confidence)

### Default Configuration
Set default site and collection for queries without specific context:
```bash
export HELPSCOUT_DEFAULT_DOCS_SITE_ID="your-site-id"
export HELPSCOUT_DEFAULT_DOCS_COLLECTION_ID="your-collection-id"
```

### Discovery Tools
- Use `listDocsSites` to see all Docs sites (with optional NLP filtering)
- Use `listAllDocsCollections` to see all available collections across sites
- Use `getSiteCollections` to get collections for a specific site using NLP
- Sites and collections are automatically cached for performance

## Compatibility

**Works with any [Model Context Protocol (MCP)](https://modelcontextprotocol.io) compatible client:**

- **🖥️ Desktop Applications**: Claude Desktop, AI coding assistants, and other MCP-enabled desktop apps
- **📝 Code Editors**: VS Code extensions, Cursor, and other editors with MCP support
- **🔌 Custom Integrations**: Any application implementing the MCP standard
- **🛠️ Development Tools**: Command-line MCP clients and custom automation scripts

**Primary Platform**: [Claude Desktop](https://claude.ai/desktop) with full DXT and manual configuration support

*Since this server follows the MCP standard, it automatically works with any current or future MCP-compatible client.*

## Security & Privacy

- **🔒 PII Protection**: Message content redacted by default
- **🛡️ Secure Authentication**: OAuth2 Client Credentials or Personal Access Token with automatic refresh
- **📝 Audit Logging**: Comprehensive request tracking and error logging
- **⚡ Rate Limiting**: Built-in retry logic with exponential backoff
- **🏢 Enterprise Ready**: SOC2 compliant deployment options

## Changelog

### v1.3.0 (2025-08-01)
- Fixed Reports API response unwrapping for `getCompanyReport`, `getEmailReport`, `getChatReport`, `getPhoneReport`, `getUserReport`
- Fixed `getHappinessReport` endpoint URL to use `/v2/reports/happiness/overall`
- Fixed `listDocsSites` response structure to properly handle sites array
- Added Reports API client for proper response handling
- Improved error messages for Reports API endpoints

## Development

```bash
# Quick start
git clone https://github.com/zackkatz/help-scout-mcp-server.git
cd help-scout-mcp-server
npm install && npm run build

# Create .env file with your credentials (OAuth2)
echo "HELPSCOUT_CLIENT_ID=your-client-id" > .env
echo "HELPSCOUT_CLIENT_SECRET=your-client-secret" >> .env

# Start the server
npm start
```

## Troubleshooting

### Common Issues

**Authentication Failed**
```bash
# Verify your credentials
echo $HELPSCOUT_CLIENT_ID
echo $HELPSCOUT_CLIENT_SECRET

# Test with curl
curl -X POST https://api.helpscout.net/v2/oauth2/token \
  -d "grant_type=client_credentials&client_id=$HELPSCOUT_CLIENT_ID&client_secret=$HELPSCOUT_CLIENT_SECRET"
```

**Connection Timeouts**
- Check your network connection to `api.helpscout.net`
- Verify no firewall blocking HTTPS traffic
- Consider increasing `HTTP_SOCKET_TIMEOUT` environment variable

**Rate Limiting**
- The server automatically handles rate limits with exponential backoff
- Reduce concurrent requests if you see frequent 429 errors
- Monitor logs for retry patterns

**Empty Search Results**
- **Wrong tool choice**: Use `searchConversations` (no query) for listing, `comprehensiveConversationSearch` for content search
- **Empty search terms**: Don't use empty strings `[""]` with comprehensiveConversationSearch
- Verify inbox permissions with your API credentials
- Check conversation exists and you have access
- Try broader search terms or different time ranges

### Reports API "Unknown URL" Errors

If you're getting "Unknown URL" errors when accessing reports:

**1. Verify Your Plan**
- Reports API requires a **Plus** or **Pro** plan
- Standard plan users can purchase Reports as an add-on
- Check your plan: Help Scout → Manage → Account → Billing

**2. Check OAuth App Permissions**
- Go to **My Apps** → Edit your app
- Ensure **Reports** scope is selected
- Save and regenerate credentials if needed

**3. Feature Availability**
- **Happiness Reports**: Requires happiness ratings to be enabled
  - Go to: Manage → Company → Email → Happiness Ratings
- **Chat/Phone Reports**: Only available if these channels are enabled
- **Docs Reports**: Requires Help Scout Docs to be enabled

**4. API Response Debugging**
```bash
# Enable debug logging to see actual API responses
LOG_LEVEL=debug npx help-scout-mcp-server
```

**5. Test with Personal Access Token**
Sometimes OAuth apps have permission issues. Test with a Personal Access Token:
```bash
HELPSCOUT_API_KEY="Bearer your-personal-token" npx help-scout-mcp-server
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
LOG_LEVEL=debug npx help-scout-mcp-server
```

### Getting Help

If you're still having issues:
1. Check [existing issues](https://github.com/zackkatz/help-scout-mcp-server/issues)
2. Enable debug logging and share relevant logs
3. Include your configuration (without credentials!)

## Contributing

We welcome contributions! Here's how to get started:

### 🚀 Quick Development Setup

```bash
git clone https://github.com/zackkatz/help-scout-mcp-server.git
cd help-scout-mcp-server
npm install
```

### 🔧 Development Workflow

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build for development
npm run build

# Start development server
npm run dev
```

### 📋 Before Submitting

- ✅ All tests pass (`npm test`)
- ✅ Type checking passes (`npm run type-check`)
- ✅ Linting passes (`npm run lint`)
- ✅ Add tests for new features
- ✅ Update documentation if needed

### 🐛 Bug Reports

When reporting bugs, please include:
- Help Scout MCP Server version
- Node.js version
- Authentication method (OAuth2/Personal Access Token)
- Error messages and logs
- Steps to reproduce

### 💡 Feature Requests

We'd love to hear your ideas! Please open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternative approaches you've considered

## Support

- **Issues**: [GitHub Issues](https://github.com/zackkatz/help-scout-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zackkatz/help-scout-mcp-server/discussions)
- **NPM Package**: [help-scout-mcp-server](https://www.npmjs.com/package/help-scout-mcp-server)

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Need help?** [Open an issue](https://github.com/zackkatz/help-scout-mcp-server/issues) or check our [documentation](https://github.com/zackkatz/help-scout-mcp-server/wiki).