import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './contexts/AppContext';

// --- ЗАПЛАТКА ДЛЯ SQUWIZ СТАРТ ---
(function() {
    // 1. Защита Строк (String)
    const originalStringIncludes = String.prototype.includes;
    // @ts-ignore
    String.prototype.includes = function(searchString: any, position?: number) {
        if (this == null) return false;
        try {
            // @ts-ignore
            return originalStringIncludes.apply(this, arguments);
        } catch (e) {
            console.warn("SQUWIZ Shield: Ошибка в String.includes() была подавлена", e);
            return false;
        }
    };

    // 2. Защита Массивов (Array) - критично для списков лайков и фолловеров
    const originalArrayIncludes = Array.prototype.includes;
    // @ts-ignore
    Array.prototype.includes = function(searchElement: any, fromIndex?: number) {
        if (this == null) return false;
        try {
            // @ts-ignore
            return originalArrayIncludes.apply(this, arguments);
        } catch (e) {
            console.warn("SQUWIZ Shield: Ошибка в Array.includes() была подавлена", e);
            return false;
        }
    };
    
    console.log("🛡 Защита SQUWIZ (String + Array) активирована!");
})();
// --- ЗАПЛАТКА ДЛЯ SQUWIZ КОНЕЦ ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
