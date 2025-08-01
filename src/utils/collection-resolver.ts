import { DocsSite, DocsCollection } from '../schema/types.js';
import { logger } from './logger.js';

export interface CollectionMatch {
  collection: DocsCollection;
  site: DocsSite;
  matchScore: number;
  matchReason: string;
}

export class CollectionResolver {
  private sites: DocsSite[] = [];
  private collections: Map<string, DocsCollection[]> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour

  /**
   * Resolve a collection from natural language input
   * @param input User input that might contain collection/site names
   * @param defaultCollectionId Optional default collection ID from config
   * @returns Best matching collection or null
   */
  async resolveCollection(
    input: string,
    defaultCollectionId?: string
  ): Promise<CollectionMatch | null> {
    // Ensure we have fresh data
    await this.ensureDataLoaded();

    const normalizedInput = input.toLowerCase();
    const matches: CollectionMatch[] = [];

    // Check each site and its collections
    for (const site of this.sites) {
      const siteCollections = this.collections.get(site.id) || [];
      
      for (const collection of siteCollections) {
        let matchScore = 0;
        let matchReason = '';

        // Direct collection name match
        if (normalizedInput.includes(collection.name.toLowerCase())) {
          matchScore = 100;
          matchReason = `Direct match: "${collection.name}"`;
        }
        // Site name match (e.g., "GravityKit" matches site)
        else if (site.name && normalizedInput.includes(site.name.toLowerCase())) {
          matchScore = 80;
          matchReason = `Site match: "${site.name}"`;
        }
        // Subdomain match
        else if (site.subdomain && normalizedInput.includes(site.subdomain.toLowerCase())) {
          matchScore = 70;
          matchReason = `Subdomain match: "${site.subdomain}"`;
        }
        // Collection slug match
        else if (collection.slug && normalizedInput.includes(collection.slug.toLowerCase())) {
          matchScore = 60;
          matchReason = `Slug match: "${collection.slug}"`;
        }
        // Partial word matches
        else {
          const collectionWords = collection.name.toLowerCase().split(/\s+/);
          const inputWords = normalizedInput.split(/\s+/);
          const matchingWords = collectionWords.filter(word => 
            inputWords.some(inputWord => inputWord.includes(word) || word.includes(inputWord))
          );
          
          if (matchingWords.length > 0) {
            matchScore = (matchingWords.length / collectionWords.length) * 50;
            matchReason = `Partial match: ${matchingWords.join(', ')}`;
          }
        }

        // Boost score if this is the default collection
        if (defaultCollectionId && collection.id === defaultCollectionId) {
          matchScore += 10;
          matchReason += ' (default)';
        }

        if (matchScore > 0) {
          matches.push({
            collection,
            site,
            matchScore,
            matchReason
          });
        }
      }
    }

    // Sort by match score and return the best match
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    if (matches.length > 0) {
      logger.info('Collection resolved', {
        input: input.substring(0, 100),
        bestMatch: matches[0].collection.name,
        site: matches[0].site.name || matches[0].site.subdomain,
        score: matches[0].matchScore,
        reason: matches[0].matchReason,
        totalMatches: matches.length
      });
      
      return matches[0];
    }

    // If no matches and we have a default, try to find it
    if (defaultCollectionId) {
      for (const site of this.sites) {
        const siteCollections = this.collections.get(site.id) || [];
        const defaultCollection = siteCollections.find(c => c.id === defaultCollectionId);
        
        if (defaultCollection) {
          logger.info('Using default collection', {
            collectionId: defaultCollectionId,
            collectionName: defaultCollection.name
          });
          
          return {
            collection: defaultCollection,
            site,
            matchScore: 10,
            matchReason: 'Default collection'
          };
        }
      }
    }

    logger.warn('No collection match found', { input: input.substring(0, 100) });
    return null;
  }

  /**
   * Get all available collections grouped by site
   */
  async getAllCollections(): Promise<Map<DocsSite, DocsCollection[]>> {
    await this.ensureDataLoaded();
    
    const result = new Map<DocsSite, DocsCollection[]>();
    for (const site of this.sites) {
      const siteCollections = this.collections.get(site.id) || [];
      if (siteCollections.length > 0) {
        result.set(site, siteCollections);
      }
    }
    
    return result;
  }

  /**
   * Clear cached data to force refresh
   */
  clearCache(): void {
    this.sites = [];
    this.collections.clear();
    this.lastFetch = 0;
    logger.info('Collection resolver cache cleared');
  }

  /**
   * Ensure we have loaded sites and collections data
   */
  private async ensureDataLoaded(): Promise<void> {
    const now = Date.now();
    
    // Check if cache is still valid
    if (this.sites.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return;
    }

    logger.info('Loading sites and collections for resolver');
    
    try {
      // Dynamically import to avoid circular dependencies
      const { ServiceContainer } = await import('./service-container.js');
      const container = ServiceContainer.getInstance();
      const { helpScoutDocsClient } = container.createResolver().resolve(['helpScoutDocsClient']);

      // Fetch all sites
      const sitesResponse = await helpScoutDocsClient.get<any>('/sites', { page: 1 });
      
      if (!sitesResponse.items || sitesResponse.items.length === 0) {
        logger.warn('No sites found for collection resolver');
        return;
      }

      this.sites = sitesResponse.items;
      this.collections.clear();

      // Fetch collections for each site
      for (const site of this.sites) {
        try {
          const collectionsResponse = await helpScoutDocsClient.get<any>('/collections', {
            siteId: site.id,
            page: 1,
            pageSize: 100
          });

          if (collectionsResponse.items && collectionsResponse.items.length > 0) {
            this.collections.set(site.id, collectionsResponse.items);
            logger.debug('Loaded collections for site', {
              siteId: site.id,
              siteName: site.name || site.subdomain,
              collectionCount: collectionsResponse.items.length
            });
          }
        } catch (error) {
          logger.error('Failed to load collections for site', {
            siteId: site.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      this.lastFetch = now;
      
      logger.info('Collection resolver data loaded', {
        siteCount: this.sites.length,
        totalCollections: Array.from(this.collections.values()).reduce((sum, cols) => sum + cols.length, 0)
      });
    } catch (error) {
      logger.error('Failed to load data for collection resolver', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Create singleton instance
export const collectionResolver = new CollectionResolver();