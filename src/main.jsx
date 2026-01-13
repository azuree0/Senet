import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../style.css';
import * as winTests from './testWinConditions.js';

// Expose test functions to window for console access
try {
  window.testLightWin = winTests.testLightWin;
  window.testDarkWin = winTests.testDarkWin;
  window.testLightWinScenario = winTests.testLightWinScenario;
  window.testDarkWinScenario = winTests.testDarkWinScenario;
  window.runAllWinTests = winTests.runAllWinTests;

  // Log available test functions with better visibility
  setTimeout(() => {
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold;');
    console.log('%c🧪 WIN CONDITION TESTS AVAILABLE', 'color: #667eea; font-weight: bold; font-size: 16px;');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold;');
    console.log('%cAvailable test functions:', 'color: #764ba2; font-weight: bold; font-size: 14px;');
    console.log('  %ctestLightWin()%c - Test Light player win condition', 'color: #00ff00; font-weight: bold;', 'color: inherit;');
    console.log('  %ctestDarkWin()%c - Test Dark player win condition', 'color: #00ff00; font-weight: bold;', 'color: inherit;');
    console.log('  %ctestLightWinScenario()%c - Automated Light win scenario', 'color: #00ff00; font-weight: bold;', 'color: inherit;');
    console.log('  %ctestDarkWinScenario()%c - Automated Dark win scenario', 'color: #00ff00; font-weight: bold;', 'color: inherit;');
    console.log('  %crunAllWinTests()%c - Run all win condition tests', 'color: #00ff00; font-weight: bold;', 'color: inherit;');
    console.log('\n%c💡 Example: Type %crunAllWinTests()%c in the console', 'color: #667eea;', 'color: #00ff00; font-weight: bold;', 'color: #667eea;');
    console.log('%c═══════════════════════════════════════════════════════════\n', 'color: #667eea; font-weight: bold;');
    
    // Verify functions are available
    if (typeof window.testLightWin === 'function' && 
        typeof window.testDarkWin === 'function' &&
        typeof window.runAllWinTests === 'function') {
      console.log('%c✅ All test functions loaded successfully!', 'color: #00ff00; font-weight: bold;');
    } else {
      console.error('%c❌ Error: Some test functions failed to load', 'color: #ff0000; font-weight: bold;');
    }
  }, 100);
} catch (error) {
  console.error('Error loading test functions:', error);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
