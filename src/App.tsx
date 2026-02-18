import { useState, useEffect } from 'react';

function App() {
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    // Check if Electron API is available
    if (window.electron) {
      setStatus('✅ Electron API loaded successfully!');
    } else {
      setStatus('⚠️ Running in browser mode (Electron API not available)');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
            NotifyForce 🔔💥
          </h1>
          <p className="text-gray-300 text-lg">
            絶対に見逃さない通知デスクトップアプリ
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white font-mono text-sm">{status}</span>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h2 className="text-white font-semibold text-xl mb-4">主要機能</h2>
              {[
                { icon: '📱', text: 'スマホ風通知UI' },
                { icon: '🔴', text: '会議URL優先表示' },
                { icon: '⚡', text: 'リアルタイム通知' },
                { icon: '⌨️', text: 'ショートカットキー (Ctrl+Shift+N)' },
                { icon: '🎯', text: '常に最前面表示' },
                { icon: '🔧', text: 'Tray常駐' },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-gray-200">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Tech Stack */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-gray-400 text-sm font-semibold mb-3">技術スタック</h3>
              <div className="flex flex-wrap gap-2">
                {['Electron', 'React 18', 'TypeScript', 'Vite', 'Tailwind CSS'].map(
                  (tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium"
                    >
                      {tech}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-gray-400 text-sm font-semibold mb-3">次のステップ</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>プロジェクト初期化完了</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">→</span>
                  <span>通知パネルUIの実装 (TASK-005)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">○</span>
                  <span>API連携の実装 (TASK-008~011)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Press <kbd className="px-2 py-1 bg-gray-800 rounded text-purple-400">Ctrl+Shift+N</kbd> to toggle notification panel
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
