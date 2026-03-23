"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTelemetry = exports.IncrementalSorter = exports.SortResultCache = void 0;
exports.sortImportsOptimized = sortImportsOptimized;
const sortImports_1 = require("./sortImports");
/**
 * Performance optimization utilities for react-import-sorter
 */
/**
 * LRU Cache for sort results
 * Caches results based on file content hash to avoid re-sorting identical code
 */
class SortResultCache {
    cache = new Map();
    MAX_CACHE_SIZE = 100;
    /**
     * Generate a simple hash of the input code
     */
    hashCode(code) {
        let hash = 0;
        if (code.length === 0)
            return '0';
        for (let i = 0; i < code.length; i++) {
            const char = code.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    /**
     * Get cached result if available
     */
    get(code) {
        const key = this.hashCode(code);
        return this.cache.get(key) || null;
    }
    /**
     * Store result in cache
     */
    set(code, result) {
        const key = this.hashCode(code);
        // Remove oldest entry if cache is full
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const iterator = this.cache.keys();
            const firstKey = iterator.next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, result);
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.MAX_CACHE_SIZE,
        };
    }
}
exports.SortResultCache = SortResultCache;
/**
 * Incremental sorter for large files
 * Processes files in chunks to improve responsiveness
 */
class IncrementalSorter {
    /**
     * Check if sorting is needed before performing full sort
     * This is faster than the full sort and can avoid unnecessary work
     */
    static needsSorting(code, options = {}) {
        // Quick check: look for import lines that are out of order
        const lines = code.split('\n');
        const importLines = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('import ')) {
                importLines.push({ line, index: i });
            }
            else if (importLines.length > 0 && line !== '') {
                break;
            }
        }
        if (importLines.length <= 1) {
            return false; // Single import or none, no sorting needed
        }
        // Check if imports are already sorted (simplified check)
        const sortedImports = [...importLines].sort((a, b) => {
            const aLine = a.line || '';
            const bLine = b.line || '';
            return aLine.localeCompare(bLine);
        });
        for (let i = 0; i < importLines.length; i++) {
            if (importLines[i].line !== sortedImports[i].line) {
                return true; // Out of order, sorting needed
            }
        }
        return false;
    }
    /**
     * Get import count for metrics
     */
    static countImports(code) {
        const importRegex = /^import\s/gm;
        const matches = code.match(importRegex);
        return matches ? matches.length : 0;
    }
    /**
     * Estimate processing complexity
     */
    static estimateComplexity(code) {
        const lines = code.split('\n');
        const imports = this.countImports(code);
        const linesPerImport = lines.length / (imports || 1);
        if (imports <= 5) {
            return 'simple';
        }
        else if (imports <= 20) {
            return 'moderate';
        }
        else {
            return 'complex';
        }
    }
}
exports.IncrementalSorter = IncrementalSorter;
/**
 * Performance telemetry for monitoring sorting performance
 */
class PerformanceTelemetry {
    sortTimes = [];
    cacheHits = 0;
    cacheMisses = 0;
    MAX_SAMPLES = 100;
    /**
     * Record a sort operation with its duration
     */
    recordSort(durationMs) {
        this.sortTimes.push(durationMs);
        // Keep only recent samples
        if (this.sortTimes.length > this.MAX_SAMPLES) {
            this.sortTimes.shift();
        }
    }
    /**
     * Record a cache hit
     */
    recordCacheHit() {
        this.cacheHits++;
    }
    /**
     * Record a cache miss
     */
    recordCacheMiss() {
        this.cacheMisses++;
    }
    /**
     * Get performance metrics
     */
    getMetrics() {
        const avgTime = this.sortTimes.length > 0
            ? this.sortTimes.reduce((a, b) => a + b, 0) / this.sortTimes.length
            : 0;
        const maxTime = this.sortTimes.length > 0 ? Math.max(...this.sortTimes) : 0;
        const minTime = this.sortTimes.length > 0 ? Math.min(...this.sortTimes) : 0;
        const totalCacheOps = this.cacheHits + this.cacheMisses;
        const cacheHitRate = totalCacheOps > 0 ? ((this.cacheHits / totalCacheOps) * 100).toFixed(1) : 'N/A';
        return {
            averageSortTimeMs: avgTime.toFixed(2),
            maxSortTimeMs: maxTime,
            minSortTimeMs: minTime,
            totalSorts: this.sortTimes.length,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            cacheHitRatePercent: cacheHitRate,
        };
    }
    /**
     * Reset all metrics
     */
    reset() {
        this.sortTimes = [];
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
}
exports.PerformanceTelemetry = PerformanceTelemetry;
/**
 * High-performance sort wrapper with caching and telemetry
 */
function sortImportsOptimized(code, options = {}, cache, telemetry) {
    // Check cache first
    if (cache) {
        const cached = cache.get(code);
        if (cached) {
            if (telemetry)
                telemetry.recordCacheHit();
            return cached;
        }
    }
    if (telemetry)
        telemetry.recordCacheMiss();
    // Early exit if no sorting needed
    if (!IncrementalSorter.needsSorting(code, options)) {
        return {
            code,
            changed: false,
            diagnostics: [],
            metadata: { importCount: 0, groupCount: 0 },
        };
    }
    // Measure sort time
    const startTime = performance.now();
    const result = (0, sortImports_1.sortImportsResult)(code, options);
    const endTime = performance.now();
    // Record telemetry
    if (telemetry) {
        telemetry.recordSort(endTime - startTime);
    }
    // Cache result
    if (cache) {
        cache.set(code, result);
    }
    return result;
}
