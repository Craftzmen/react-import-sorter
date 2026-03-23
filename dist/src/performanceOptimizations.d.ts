import { SortImportsOptions, SortResult } from './sortImports';
/**
 * Performance optimization utilities for react-import-sorter
 */
/**
 * LRU Cache for sort results
 * Caches results based on file content hash to avoid re-sorting identical code
 */
export declare class SortResultCache {
    private cache;
    private readonly MAX_CACHE_SIZE;
    /**
     * Generate a simple hash of the input code
     */
    private hashCode;
    /**
     * Get cached result if available
     */
    get(code: string): SortResult | null;
    /**
     * Store result in cache
     */
    set(code: string, result: SortResult): void;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
    };
}
/**
 * Incremental sorter for large files
 * Processes files in chunks to improve responsiveness
 */
export declare class IncrementalSorter {
    /**
     * Check if sorting is needed before performing full sort
     * This is faster than the full sort and can avoid unnecessary work
     */
    static needsSorting(code: string, options?: SortImportsOptions): boolean;
    /**
     * Get import count for metrics
     */
    static countImports(code: string): number;
    /**
     * Estimate processing complexity
     */
    static estimateComplexity(code: string): 'simple' | 'moderate' | 'complex';
}
/**
 * Performance telemetry for monitoring sorting performance
 */
export declare class PerformanceTelemetry {
    private sortTimes;
    private cacheHits;
    private cacheMisses;
    private readonly MAX_SAMPLES;
    /**
     * Record a sort operation with its duration
     */
    recordSort(durationMs: number): void;
    /**
     * Record a cache hit
     */
    recordCacheHit(): void;
    /**
     * Record a cache miss
     */
    recordCacheMiss(): void;
    /**
     * Get performance metrics
     */
    getMetrics(): {
        averageSortTimeMs: string;
        maxSortTimeMs: number;
        minSortTimeMs: number;
        totalSorts: number;
        cacheHits: number;
        cacheMisses: number;
        cacheHitRatePercent: string;
    };
    /**
     * Reset all metrics
     */
    reset(): void;
}
/**
 * High-performance sort wrapper with caching and telemetry
 */
export declare function sortImportsOptimized(code: string, options?: SortImportsOptions, cache?: SortResultCache, telemetry?: PerformanceTelemetry): SortResult;
