export interface DiscoveryJobData {
  /** Optional override for the number of search queries to run */
  maxQueries?: number;
  /** Who triggered the run (e.g. "cron", "manual") */
  triggeredBy?: string;
  excludedDomains?: string[]; // New field to specify domains to exclude from search results
}

export interface DiscoveryJobResult {
  runId: string;
  validMarketplacesFound: number;
  sitesPersistedForReview: number;
}

export interface DiscoveryJobStatus {
  id: string;
  status: 'running' | 'completed' | 'standby' | 'failed';
  progress: number;
  triggeredBy?: string;
  createdAt: Date;
  updatedAt: Date;
  result?: DiscoveryJobResult;
}
