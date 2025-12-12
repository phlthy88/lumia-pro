/**
 * CSP-safe blob URL creation and management
 */

let cspViolationsDetected = false;

// Monitor for CSP violations
if (typeof document !== 'undefined') {
  document.addEventListener('securitypolicyviolation', (e) => {
    if (e.violatedDirective.includes('img-src') || e.violatedDirective.includes('media-src')) {
      console.warn('[CSPUtils] Blob URL blocked by CSP:', {
        violatedDirective: e.violatedDirective,
        blockedURI: e.blockedURI,
        originalPolicy: e.originalPolicy
      });
      cspViolationsDetected = true;
    }
  });
}

/**
 * Create a blob URL with CSP fallback
 */
export function createCSPAwareBlobURL(blob: Blob): string | null {
  try {
    const url = URL.createObjectURL(blob);
    
    // Test if the URL will work with current CSP
    if (cspViolationsDetected) {
      console.warn('[CSPUtils] Previous CSP violations detected, blob URLs may not work');
      URL.revokeObjectURL(url);
      return null;
    }
    
    return url;
  } catch (error) {
    console.error('[CSPUtils] Failed to create blob URL:', error);
    return null;
  }
}

/**
 * Create a data URL as fallback when blob URLs are blocked
 */
export async function blobToDataURL(blob: Blob): Promise<string | null> {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => {
        console.error('[CSPUtils] Failed to convert blob to data URL');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[CSPUtils] Error converting blob to data URL:', error);
    return null;
  }
}

/**
 * Get best available URL for a blob (blob: or data:)
 */
export async function getCSPSafeBlobURL(blob: Blob): Promise<string | null> {
  // First try blob URL
  const blobUrl = createCSPAwareBlobURL(blob);
  if (blobUrl) return blobUrl;
  
  // Fallback to data URL
  console.log('[CSPUtils] Falling back to data URL due to CSP restrictions');
  return await blobToDataURL(blob);
}

/**
 * Check if blob URLs are likely to work with current CSP
 */
export function areBlobURLsAllowed(): boolean {
  if (cspViolationsDetected) return false;
  
  // Check current CSP meta tags
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    const cspContent = cspMeta.getAttribute('content') || '';
    const allowsBlobURLs = cspContent.includes('blob:');
    console.log('[CSPUtils] CSP allows blob URLs:', allowsBlobURLs);
    return allowsBlobURLs;
  }
  
  // No CSP meta tag found, assume blob URLs are allowed
  return true;
}

/**
 * Revoke a blob URL safely
 */
export function revokeCSPAwareBlobURL(url: string | null): void {
  if (!url) return;
  
  try {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    // Data URLs don't need revocation
  } catch (error) {
    console.warn('[CSPUtils] Failed to revoke URL:', error);
  }
}