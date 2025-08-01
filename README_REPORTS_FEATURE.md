# Help Scout Reports API Feature

I've successfully implemented the Help Scout Reports API tools in your MCP server. This enables you to retrieve the top 100 most read Help Scout docs from the past 12 months.

## New Tools Added

### 1. `getTopArticles`
Retrieves the most viewed Help Scout Docs articles for a specified time period.

**Usage Example:**
```json
{
  "tool": "getTopArticles",
  "arguments": {
    "limit": 100,
    "includeStats": true
  }
}
```

**Parameters:**
- `start` (optional): Start date for the report period (ISO 8601). Defaults to 12 months ago.
- `end` (optional): End date for the report period (ISO 8601). Defaults to now.
- `sites` (optional): Array of site IDs to filter by.
- `collections` (optional): Array of collection IDs to filter by.
- `limit` (optional): Number of top articles to return (max 500, default 100).
- `includeStats` (optional): Include detailed statistics for each article (default true).

### 2. `getDocsReport`
Gets comprehensive Help Scout Docs analytics report with article views, creation, and update statistics.

**Usage Example:**
```json
{
  "tool": "getDocsReport",
  "arguments": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2024-01-01T00:00:00Z"
  }
}
```

## Implementation Details

1. **Created `src/tools/reports-tools.ts`**: New file containing the `ReportsToolHandler` class with both tools.

2. **Integrated into main tool handler**: Updated `src/tools/index.ts` to include the reports tools.

3. **Uses existing HelpScout client**: The implementation leverages the existing authenticated Help Scout API client.

## To Use This Feature

1. Ensure your Help Scout API key has permissions to access the Reports API.

2. Use the MCP tool `getTopArticles` to get the top 100 most read docs:
   ```
   mcp__helpscout__getTopArticles({ "limit": 100 })
   ```

   This will automatically use the past 12 months as the time range.

3. The response will include:
   - Article ID, title, and view count
   - Collection and site information
   - Additional statistics like average time on page and bounce rate (if `includeStats` is true)

## Important Notes

- The Help Scout Reports API requires specific permissions. If you get a 404 error, ensure your API key has reports access.
- The existing project has some unrelated TypeScript compilation errors in `docs-tools.ts` that were present before this implementation.
- The Reports API endpoint is: `https://api.helpscout.net/v2/reports/docs`

## Alternative Approach

If the Reports API is not available with your current API key, you can still use the existing `listDocsArticlesByCollection` tool with `sort: "popularity"`, though this won't provide time-based filtering.