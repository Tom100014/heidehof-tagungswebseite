// PWA Security and Performance Utilities
export class PWASecurity {
  private static instance: PWASecurity;
  private hasMeasuredPerformance = false;

  static getInstance(): PWASecurity {
    if (!PWASecurity.instance) {
      PWASecurity.instance = new PWASecurity();
    }
    return PWASecurity.instance;
  }

  // Initialize security headers and PWA meta tags
  initializeSecurityHeaders() {
    this.addSecurityMetaTags();
    // CSP and "secure defaults" (right-click block, viewport-zoom hack) intentionally
    // removed: CSP belongs in HTTP headers (Lovable hosting), the right-click/selectstart
    // blocks broke A11y (screen readers, copy-to-clipboard), and the input-focus
    // viewport override was a WCAG 1.4.4 fail. iOS-zoom on input focus is now prevented
    // via `font-size: 16px` on inputs in src/index.css instead.
  }

  private addSecurityMetaTags() {
    const metaTags = [
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { name: 'msapplication-tap-highlight', content: 'no' },
      { name: 'application-name', content: 'Heidehof' },
      { name: 'msapplication-TileColor', content: '#1a365d' },
      { name: 'msapplication-config', content: '/browserconfig.xml' },
    ];

    metaTags.forEach(({ name, content }) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    });
  }

  // Validate PWA readiness
  async validatePWAReadiness(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      errors.push('PWA requires HTTPS');
    }

    if (!('serviceWorker' in navigator)) {
      errors.push('Service Worker not supported');
    }

    try {
      const manifestResponse = await fetch('/manifest.json');
      if (!manifestResponse.ok) {
        errors.push('Web App Manifest not found');
      } else {
        const manifest = await manifestResponse.json();
        if (!manifest.name || !manifest.start_url) {
          errors.push('Invalid Web App Manifest');
        }
        if (!manifest.icons || manifest.icons.length === 0) {
          warnings.push('No icons in manifest');
        }
      }
    } catch {
      errors.push('Failed to load Web App Manifest');
    }

    const requiredFeatures = ['fetch', 'Promise', 'indexedDB'];
    requiredFeatures.forEach((feature) => {
      if (!(feature in window)) {
        errors.push(`Required feature not supported: ${feature}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Performance monitoring – DEV-only, single-run
  measurePerformance() {
    if (this.hasMeasuredPerformance) return null;
    this.hasMeasuredPerformance = true;

    if (!('performance' in window)) return null;

    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming | undefined;
    if (!navigation) return null;

    const paint = performance.getEntriesByType('paint');
    const metrics = {
      domContentLoaded:
        navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint:
        paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
      timeToInteractive: navigation.domInteractive - navigation.fetchStart,
    };

    if (import.meta.env.DEV) {
      console.log('PWA Performance Metrics:', metrics);
    }
    return metrics;
  }
}

export const pwaSecurity = PWASecurity.getInstance();
