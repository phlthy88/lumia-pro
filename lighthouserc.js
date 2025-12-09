module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        // Skip audits that don't apply to camera apps
        skipAudits: [
          'uses-http2',
          'redirects-http',
        ],
        // Throttle to simulate real conditions
        throttling: {
          cpuSlowdownMultiplier: 2,
        },
      },
    },
    assert: {
      assertions: {
        // Performance budgets
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.7 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
        
        // Bundle size
        'total-byte-weight': ['warn', { maxNumericValue: 2000000 }], // 2MB
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
        
        // PWA requirements
        'installable-manifest': 'error',
        'service-worker': 'warn',
        'maskable-icon': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
