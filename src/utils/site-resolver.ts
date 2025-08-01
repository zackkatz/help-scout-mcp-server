import { DocsSite } from '../schema/types.js';
import { logger } from './logger.js';

export interface SiteMatch {
  site: DocsSite;
  matchScore: number;
  matchReason: string;
}

export class SiteResolver {
  private sites: DocsSite[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour

  /**
   * Resolve a site from natural language input
   * @param input User input that might contain site names
   * @param defaultSiteId Optional default site ID from config
   * @returns Best matching site or null
   */
  async resolveSite(
    input: string,
    defaultSiteId?: string
  ): Promise<SiteMatch | null> {
    // Ensure we have fresh data
    await this.ensureDataLoaded();

    const normalizedInput = input.toLowerCase();
    const matches: SiteMatch[] = [];

    for (const site of this.sites) {
      let matchScore = 0;
      let matchReason = '';

      // Direct site name match
      if (site.name && normalizedInput.includes(site.name.toLowerCase())) {
        matchScore = 100;
        matchReason = `Site name match: "${site.name}"`;
      }
      // Subdomain match
      else if (site.subdomain && normalizedInput.includes(site.subdomain.toLowerCase())) {
        matchScore = 80;
        matchReason = `Subdomain match: "${site.subdomain}"`;
      }
      // CNAME match
      else if (site.cname && normalizedInput.includes(site.cname.toLowerCase())) {
        matchScore = 70;
        matchReason = `CNAME match: "${site.cname}"`;
      }
      // Partial word matches
      else {
        const siteWords = [
          ...(site.name?.toLowerCase().split(/\s+/) || []),
          ...(site.subdomain?.toLowerCase().split(/[-_]/) || [])
        ].filter(word => word.length > 2); // Filter out short words
        
        const inputWords = normalizedInput.split(/\s+/);
        const matchingWords = siteWords.filter(word => 
          inputWords.some(inputWord => inputWord.includes(word) || word.includes(inputWord))
        );
        
        if (matchingWords.length > 0) {
          matchScore = (matchingWords.length / Math.max(siteWords.length, 1)) * 50;
          matchReason = `Partial match: ${matchingWords.join(', ')}`;
        }
      }

      // Boost score if this is the default site
      if (defaultSiteId && site.id === defaultSiteId) {
        matchScore += 10;
        matchReason += ' (default)';
      }

      if (matchScore > 0) {
        matches.push({
          site,
          matchScore,
          matchReason
        });
      }
    }

    // Sort by match score and return the best match
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    if (matches.length > 0) {
      logger.info('Site resolved', {
        input: input.substring(0, 100),
        bestMatch: matches[0].site.name || matches[0].site.subdomain,
        score: matches[0].matchScore,
        reason: matches[0].matchReason,
        totalMatches: matches.length
      });
      
      return matches[0];
    }

    // If no matches and we have a default, try to find it
    if (defaultSiteId) {
      const defaultSite = this.sites.find(s => s.id === defaultSiteId);
      
      if (defaultSite) {
        logger.info('Using default site', {
          siteId: defaultSiteId,
          siteName: defaultSite.name || defaultSite.subdomain
        });
        
        return {
          site: defaultSite,
          matchScore: 10,
          matchReason: 'Default site'
        };
      }
    }

    logger.warn('No site match found', { input: input.substring(0, 100) });
    return null;
  }

  /**
   * Get all available sites
   */
  async getAllSites(): Promise<DocsSite[]> {
    await this.ensureDataLoaded();
    return [...this.sites];
  }

  /**
   * Clear cached data to force refresh
   */
  clearCache(): void {
    this.sites = [];
    this.lastFetch = 0;
    logger.info('Site resolver cache cleared');
  }

  /**
   * Ensure we have loaded sites data
   */
  private async ensureDataLoaded(): Promise<void> {
    const now = Date.now();
    
    // Check if cache is still valid
    if (this.sites.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return;
    }

    logger.info('Loading sites for resolver');
    
    try {
      // Dynamically import to avoid circular dependencies
      const { ServiceContainer } = await import('./service-container.js');
      const container = ServiceContainer.getInstance();
      const { helpScoutDocsClient } = container.createResolver().resolve(['helpScoutDocsClient']);

      // Fetch all sites
      const sitesResponse = await helpScoutDocsClient.get<any>('/sites', { page: 1 });
      
      if (!sitesResponse.items || sitesResponse.items.length === 0) {
        logger.warn('No sites found for site resolver');
        return;
      }

      this.sites = sitesResponse.items;
      this.lastFetch = now;
      
      logger.info('Site resolver data loaded', {
        siteCount: this.sites.length,
        sites: this.sites.map(s => ({
          id: s.id,
          name: s.name || s.subdomain,
          subdomain: s.subdomain
        }))
      });
    } catch (error) {
      logger.error('Failed to load data for site resolver', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Create singleton instance
export const siteResolver = new SiteResolver();