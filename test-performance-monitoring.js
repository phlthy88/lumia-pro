// Performance monitoring for remaining violations
console.log('🔍 Monitoring for remaining performance violations...');

// Track all performance violations
let violationLog = [];
let messageViolations = 0;
let idleCallbackViolations = 0;

// Override performance methods to track violations
const originalRIC = window.requestIdleCallback;
window.requestIdleCallback = function(callback, options) {
  const start = performance.now();
  const wrappedCallback = () => {
    const duration = performance.now() - start;
    if (duration > 50) { // Flag violations over 50ms
      idleCallbackViolations++;
      violationLog.push({
        type: 'requestIdleCallback',
        duration: duration.toFixed(1),
        timestamp: new Date().toISOString()
      });
      console.warn(`⚠️ requestIdleCallback violation: ${duration.toFixed(1)}ms`);
    }
    callback();
  };
  return originalRIC(wrappedCallback, options);
};

// Monitor for browser-reported violations
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name.includes('message')) {
      messageViolations++;
      violationLog.push({
        type: 'message',
        duration: entry.duration.toFixed(1),
        timestamp: new Date().toISOString(),
        source: entry.name
      });
      console.warn(`⚠️ Message handler violation: ${entry.duration.toFixed(1)}ms`);
    }
  }
});

try {
  observer.observe({ entryTypes: ['longtask'] });
} catch (e) {
  console.log('Long task observer not supported');
}

// Monitor vision worker updates
let visionUpdates = 0;
let lastVisionUpdate = 0;
const checkVisionUpdates = setInterval(() => {
  const now = performance.now();
  if (now - lastVisionUpdate > 900) { // Expect ~1.5s gaps
    visionUpdates++;
    if (visionUpdates <= 3) { // Limit log spam
      console.log(`👁️ Vision update #${visionUpdates}: ${(now - lastVisionUpdate).toFixed(0)}ms since last`);
    }
    lastVisionUpdate = now;
  }
}, 500);

// Monitor MediaLibrary performance
let mediaLibraryRenders = 0;
const originalSetState = React.useState;
if (window.React) {
  const checkMediaLibrary = setInterval(() => {
    const mediaElements = document.querySelectorAll('[data-media-item]');
    if (mediaElements.length > 0) {
      mediaLibraryRenders++;
      if (mediaLibraryRenders <= 5) {
        console.log(`📸 MediaLibrary: ${mediaElements.length} items rendered`);
      }
      clearInterval(checkMediaLibrary);
    }
  }, 1000);
}

// Summary after 30 seconds
setTimeout(() => {
  clearInterval(checkVisionUpdates);
  
  console.log('\n📊 Performance Summary:');
  console.log(`Message violations: ${messageViolations}`);
  console.log(`Idle callback violations: ${idleCallbackViolations}`);
  console.log(`Vision updates: ${visionUpdates}`);
  console.log(`Total violations logged: ${violationLog.length}`);
  
  if (violationLog.length > 0) {
    console.log('Violation details:', violationLog.slice(0, 5)); // Show first 5
  }
  
  // Expected results after optimizations
  if (messageViolations === 0 && idleCallbackViolations <= 2 && visionUpdates <= 5) {
    console.log('🎉 SUCCESS: Performance optimizations working!');
  } else {
    console.log('⚠️  Some violations detected - check if they\'re from external extensions');
  }
  
  // Check for external extension violations
  const externalViolations = violationLog.filter(v => 
    v.source?.includes('chrome-extension') || 
    v.source?.includes('adobe') ||
    v.source?.includes('google')
  );
  
  if (externalViolations.length > 0) {
    console.log(`External extension violations: ${externalViolations.length}`);
    console.log('These are from browser extensions and not your app code.');
  }
  
}, 30000);

console.log('✅ Performance monitoring started for 30 seconds...');
console.log('📋 Check console for real-time violation reports');