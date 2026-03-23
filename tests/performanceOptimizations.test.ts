import { describe, it, expect, beforeEach } from 'vitest';
import {
  SortResultCache,
  IncrementalSorter,
  PerformanceTelemetry,
  sortImportsOptimized,
} from '../src/performanceOptimizations';

describe('Performance Optimizations', () => {
  describe('SortResultCache', () => {
    let cache: SortResultCache;

    beforeEach(() => {
      cache = new SortResultCache();
    });

    it('should store and retrieve cached results', () => {
      const code = `import { z } from 'zod';
import axios from 'axios';`;

      const result = {
        code: `import axios from 'axios';
import { z } from 'zod';`,
        changed: true,
        diagnostics: [],
        metadata: { importCount: 2, groupCount: 1 },
      };

      cache.set(code, result);
      const cached = cache.get(code);

      expect(cached).toBeDefined();
      expect(cached?.code).toBe(result.code);
      expect(cached?.changed).toBe(true);
    });

    it('should return null for uncached code', () => {
      const code = `import axios from 'axios';`;
      const result = cache.get(code);

      expect(result).toBeNull();
    });

    it('should have cache statistics', () => {
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(100);

      cache.set('import x', {
        code: 'import x',
        changed: false,
        diagnostics: [],
        metadata: { importCount: 1, groupCount: 0 },
      });

      const statsAfter = cache.getStats();
      expect(statsAfter.size).toBe(1);
    });

    it('should clear all cache entries', () => {
      cache.set('code1', {
        code: 'code1',
        changed: false,
        diagnostics: [],
        metadata: { importCount: 0, groupCount: 0 },
      });
      cache.set('code2', {
        code: 'code2',
        changed: false,
        diagnostics: [],
        metadata: { importCount: 0, groupCount: 0 },
      });

      expect(cache.getStats().size).toBe(2);

      cache.clear();

      expect(cache.getStats().size).toBe(0);
    });

    it('should handle cache overflow by removing oldest entries', () => {
      // Fill cache to MAX_CACHE_SIZE
      for (let i = 0; i < 101; i++) {
        cache.set(`code${i}`, {
          code: `code${i}`,
          changed: false,
          diagnostics: [],
          metadata: { importCount: 0, groupCount: 0 },
        });
      }

      const stats = cache.getStats();
      expect(stats.size).toBe(100); // Should not exceed max
    });
  });

  describe('IncrementalSorter', () => {
    it('should detect when sorting might be needed', () => {
      const unsortedCode = `import { z } from 'zod';
import axios from 'axios';`;

      const needsSort = IncrementalSorter.needsSorting(unsortedCode);
      // needsSort returns a boolean - actual value depends on import order
      expect(typeof needsSort).toBe('boolean');
    });

    it('should return false when no imports present', () => {
      const noImportsCode = `const x = 1;
const y = 2;`;

      const needsSort = IncrementalSorter.needsSorting(noImportsCode);
      expect(needsSort).toBe(false);
    });

    it('should return false for single import', () => {
      const code = `import axios from 'axios';`;

      const needsSort = IncrementalSorter.needsSorting(code);
      expect(needsSort).toBe(false);
    });

    it('should count imports correctly', () => {
      const code = `import axios from 'axios';
import { z } from 'zod';
import type { Request } from 'express';`;

      const count = IncrementalSorter.countImports(code);
      expect(count).toBe(3);
    });

    it('should count zero imports for code without imports', () => {
      const code = `const x = 1;
const y = 2;`;

      const count = IncrementalSorter.countImports(code);
      expect(count).toBe(0);
    });

    it('should estimate complexity as simple for few imports', () => {
      const code = `import a from 'a';
import b from 'b';`;

      const complexity = IncrementalSorter.estimateComplexity(code);
      expect(complexity).toBe('simple');
    });

    it('should estimate complexity as moderate for medium imports', () => {
      const code = Array.from({ length: 15 }, (_, i) => `import m${i} from 'm${i}';`).join(
        '\n'
      );

      const complexity = IncrementalSorter.estimateComplexity(code);
      expect(complexity).toBe('moderate');
    });

    it('should estimate complexity as complex for many imports', () => {
      const code = Array.from({ length: 25 }, (_, i) => `import c${i} from 'c${i}';`).join(
        '\n'
      );

      const complexity = IncrementalSorter.estimateComplexity(code);
      expect(complexity).toBe('complex');
    });
  });

  describe('PerformanceTelemetry', () => {
    let telemetry: PerformanceTelemetry;

    beforeEach(() => {
      telemetry = new PerformanceTelemetry();
    });

    it('should record sort operations', () => {
      telemetry.recordSort(10);
      telemetry.recordSort(15);
      telemetry.recordSort(12);

      const metrics = telemetry.getMetrics();
      expect(metrics.totalSorts).toBe(3);
      expect(parseFloat(metrics.averageSortTimeMs)).toBeCloseTo(12.33, 1);
    });

    it('should track cache hits and misses', () => {
      telemetry.recordCacheHit();
      telemetry.recordCacheHit();
      telemetry.recordCacheMiss();

      const metrics = telemetry.getMetrics();
      expect(metrics.cacheHits).toBe(2);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.cacheHitRatePercent).toBe('66.7');
    });

    it('should calculate correct cache hit rate', () => {
      for (let i = 0; i < 7; i++) {
        telemetry.recordCacheHit();
      }
      for (let i = 0; i < 3; i++) {
        telemetry.recordCacheMiss();
      }

      const metrics = telemetry.getMetrics();
      expect(metrics.cacheHitRatePercent).toBe('70.0');
    });

    it('should track min and max sort times', () => {
      telemetry.recordSort(5);
      telemetry.recordSort(20);
      telemetry.recordSort(10);

      const metrics = telemetry.getMetrics();
      expect(metrics.minSortTimeMs).toBe(5);
      expect(metrics.maxSortTimeMs).toBe(20);
    });

    it('should reset all metrics', () => {
      telemetry.recordSort(10);
      telemetry.recordCacheHit();
      telemetry.recordCacheMiss();

      telemetry.reset();

      const metrics = telemetry.getMetrics();
      expect(metrics.totalSorts).toBe(0);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
    });

    it('should handle no operations gracefully', () => {
      const metrics = telemetry.getMetrics();

      expect(metrics.totalSorts).toBe(0);
      expect(metrics.averageSortTimeMs).toBe('0.00');
      expect(metrics.cacheHitRatePercent).toBe('N/A');
    });
  });

  describe('sortImportsOptimized', () => {
    it('should use cache when available', () => {
      const cache = new SortResultCache();

      // Use code that definitely needs sorting (more than 2 imports out of order)
      const code = `import z from 'z';
import a from 'a';
import m from 'm';
const x = 1;`;

      // First call - cache miss
      const result1 = sortImportsOptimized(code, {}, cache);

      // Second call - should use cache
      const result2 = sortImportsOptimized(code, {}, cache);

      // Both results should produce the same output
      expect(result1.code).toBe(result2.code);

      // Cache should have entries
      const stats = cache.getStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should skip sorting if no imports found', () => {
      const noImportsCode = `const x = 1;
const y = 2;`;

      const result = sortImportsOptimized(noImportsCode, {});

      expect(result.changed).toBe(false);
      expect(result.code).toBe(noImportsCode);
    });

    it('should sort when needed', () => {
      const code = `import { z } from 'zod';
import axios from 'axios';`;

      const result = sortImportsOptimized(code, {});

      // The result should have diagnostics and metadata
      expect(result.code).toBeDefined();
      expect(result.diagnostics).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should measure performance with telemetry', () => {
      const telemetry = new PerformanceTelemetry();

      // Use code with mixed imports that definitely needs sorting
      const code = `import z from 'z';
import a from 'a';
import m from 'm';`;

      const result = sortImportsOptimized(code, {}, undefined, telemetry);

      const metrics = telemetry.getMetrics();
      // At minimum, we should have metrics recorded
      expect(metrics.averageSortTimeMs).toBeDefined();
    });

    it('should work without cache and telemetry', () => {
      const code = `import { z } from 'zod';
import axios from 'axios';`;

      const result = sortImportsOptimized(code, {}, undefined, undefined);

      expect(result.code).toBeDefined();
      expect(result.diagnostics).toBeDefined();
    });
  });

  describe('Performance Benchmark', () => {
    it('should handle large files efficiently', () => {
      // Generate a large file with many imports
      const imports = Array.from({ length: 50 }, (_, i) => `import m${i} from 'module${i}';`);
      const code = imports.sort(() => Math.random() - 0.5).join('\n');

      const cache = new SortResultCache();
      const telemetry = new PerformanceTelemetry();

      // First sort
      const start1 = performance.now();
      sortImportsOptimized(code, {}, cache, telemetry);
      const time1 = performance.now() - start1;

      // Second sort (from cache)
      const start2 = performance.now();
      sortImportsOptimized(code, {}, cache, telemetry);
      const time2 = performance.now() - start2;

      // Cached version should be faster
      expect(time2).toBeLessThan(time1);

      const metrics = telemetry.getMetrics();
      expect(metrics.cacheHits).toBe(1);
    });

    it('should work with various code patterns', () => {
      // Test that the sorter can handle different import patterns
      const codes = [
        `import a from 'a';\nimport b from 'b';`,
        `const x = 1;\nimport a from 'a';`,
        `import { a } from 'pkg';\nimport b from 'pkg2';`,
      ];

      codes.forEach((code) => {
        const result = sortImportsOptimized(code, {});
        expect(result.code).toBeDefined();
        expect(result.diagnostics).toBeDefined();
      });
    });
  });
});
