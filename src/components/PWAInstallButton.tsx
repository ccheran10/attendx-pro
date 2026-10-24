import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running inside standalone PWA mode, show subtle verified status or hide
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>Installed App</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
        title="Install Attendance App on this device"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow or generic fallback guide
  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
        title="App Installation Instructions"
      >
        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Install AttendX Pro</h3>
                  <p className="text-xs text-slate-500">Fast, offline-ready mobile & desktop app</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {/* Android APK Download Card */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Android APK Package (.apk)</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Direct installable APK build for Android smartphones and tablets
                    </p>
                  </div>
                  <a
                    href="/attendx-pro.apk"
                    download="attendx-pro.apk"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download APK</span>
                  </a>
                </div>
              </div>

              {isIOS ? (
                <>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-lg">
                    <p className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Apple iOS Safari Setup:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      <li>Tap the <strong>Share</strong> button (square with arrow up) at bottom of Safari.</li>
                      <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                      <li>Confirm name and tap <strong>Add</strong> in the top right.</li>
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">Progressive Web App (PWA):</p>
                    <p>Tap the three dots menu (<strong className="text-slate-800">⋮</strong>) in Chrome/Edge and select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">Windows & macOS Desktop:</p>
                    <p>Click the <strong>Install</strong> icon on the right side of your browser address bar to install AttendX Pro as an independent window.</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-lg bg-slate-900 dark:bg-slate-100 py-2 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-800 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
