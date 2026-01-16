// ページ読み込み時に設定と統計を読み込む
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadStatistics();
  setupEventListeners();
});

// 設定を読み込む
async function loadSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  
  if (settings) {
    // トグルスイッチの状態を設定
    document.getElementById('enableToggle').checked = settings.enabled;
    
    // ステータス表示を更新
    updateStatus(settings.enabled);
    
    // デフォルト時間を表示
    document.getElementById('defaultMinutes').textContent = `${settings.defaultSessionMinutes}分`;
  }
}

// 統計情報を読み込む
async function loadStatistics() {
  const { statistics } = await chrome.storage.sync.get('statistics');
  
  if (statistics) {
    document.getElementById('totalSessions').textContent = statistics.totalSessions || 0;
  }
}

// ステータス表示を更新
function updateStatus(enabled) {
  const statusElement = document.getElementById('status');
  
  if (enabled) {
    statusElement.textContent = '✓ 有効 - 対象サイトで自動起動します';
    statusElement.className = 'status enabled';
  } else {
    statusElement.textContent = '✗ 無効 - 自動起動しません';
    statusElement.className = 'status disabled';
  }
}

// イベントリスナーを設定
function setupEventListeners() {
  // 有効/無効トグル
  document.getElementById('enableToggle').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    
    const { settings } = await chrome.storage.sync.get('settings');
    settings.enabled = enabled;
    
    await chrome.storage.sync.set({ settings });
    updateStatus(enabled);
  });
  
  // 今すぐFocus開始ボタン
  document.getElementById('manualFocus').addEventListener('click', async () => {
    const { settings } = await chrome.storage.sync.get('settings');
    const minutes = settings?.defaultSessionMinutes || 25;
    const duration = minutes * 60;

    // Raycast Focus用のURL Scheme
    const params = new URLSearchParams({
      goal: 'Manual Focus Session',
      duration: duration.toString(),
      mode: 'block'
    });

    const focusUrl = `raycast://focus/start?${params.toString()}`;
    chrome.tabs.create({ url: focusUrl, active: false }, (tab) => {
      setTimeout(() => {
        chrome.tabs.remove(tab.id);
      }, 100);
    });

    // 統計を更新
    const { statistics } = await chrome.storage.sync.get('statistics');
    const stats = statistics || { totalSessions: 0, byDomain: {} };
    stats.totalSessions += 1;

    await chrome.storage.sync.set({ statistics: stats });
    await loadStatistics();

    window.close();
  });
  
  // 設定を開くボタン
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // クールダウンをリセットボタン
  document.getElementById('clearCooldowns').addEventListener('click', async () => {
    await chrome.storage.sync.set({ cooldowns: {} });
    alert('クールダウンをリセットしました');
  });
}
