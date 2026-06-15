// Utility to detect in-app browsers (Instagram, Facebook, etc.)
// These browsers often have issues with authentication flows like Firebase Auth

export interface InAppBrowserInfo {
  isInAppBrowser: boolean;
  browserName: string | null;
  isAndroid: boolean;
  isIOS: boolean;
}

/**
 * Detects if the current browser is an in-app browser (WebView)
 * that may have issues with authentication flows
 */
export function detectInAppBrowser(): InAppBrowserInfo {
  const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
  
  // Common in-app browser patterns
  const inAppPatterns = [
    { name: 'Instagram', pattern: /Instagram/i },
    { name: 'Facebook', pattern: /FBAN|FBAV/i },
    { name: 'TikTok', pattern: /Bytedance|tiktok/i },
    { name: 'Snapchat', pattern: /Snapchat/i },
    { name: 'Twitter/X', pattern: /Twitter/i },
    { name: 'LinkedIn', pattern: /LinkedIn/i },
    { name: 'WhatsApp', pattern: /WhatsApp/i },
    { name: 'Line', pattern: /Line/i },
    { name: 'WeChat', pattern: /MicroMessenger/i },
  ];

  // Detect platform
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  // Check for in-app browser
  for (const { name, pattern } of inAppPatterns) {
    if (pattern.test(userAgent)) {
      return {
        isInAppBrowser: true,
        browserName: name,
        isAndroid,
        isIOS,
      };
    }
  }

  // Additional check for generic WebView (Android)
  if (isAndroid && /wv|WebView/i.test(userAgent)) {
    return {
      isInAppBrowser: true,
      browserName: 'In-App Browser (Android WebView)',
      isAndroid,
      isIOS,
    };
  }

  // iOS WebView detection (WKWebView)
  if (isIOS) {
    // Safari has "Safari/XXX" but WKWebView doesn't
    const isSafari = /Safari/i.test(userAgent) && /Apple Computer/.test(userAgent);
    const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    
    if (!isSafari && !isStandalone) {
      return {
        isInAppBrowser: true,
        browserName: 'In-App Browser (iOS WebView)',
        isAndroid,
        isIOS,
      };
    }
  }

  return {
    isInAppBrowser: false,
    browserName: null,
    isAndroid,
    isIOS,
  };
}

/**
 * Opens the current URL in the device's default browser
 */
export function openInDefaultBrowser(): void {
  const currentUrl = window.location.href;
  
  // Try to open in default browser
  // On iOS: use window.open with target=_blank, then fallback to location
  // On Android: use intent scheme or just window.open
  
  const newWindow = window.open(currentUrl, '_blank');
  
  // If popup blocked or didn't open, try other methods
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    // Fallback: copy URL to clipboard and show alert
    copyToClipboard(currentUrl);
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}
