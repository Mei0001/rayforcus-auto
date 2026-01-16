// デフォルト設定
const DEFAULT_SETTINGS = {
  enabled: true,
  defaultSessionMinutes: 25,
  confirmationDelay: 0,
  preventDuplicates: true,
  cooldownMinutes: 30
};

// デフォルトブラックリスト（Focus起動対象サイト）
const DEFAULT_BLACKLIST = [
  'youtube.com',
  'x.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'reddit.com',
  'netflix.com',
  'twitch.tv'
];

// 初期化処理
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Raycast Focus Auto-Start installed');
  
  // デフォルト設定を保存
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings) {
    await chrome.storage.sync.set({
      settings: DEFAULT_SETTINGS,
      blacklist: DEFAULT_BLACKLIST,
      whitelist: [],
      cooldowns: {},
      statistics: {
        totalSessions: 0,
        byDomain: {}
      }
    });
  }
});

// タブのURL変更を監視
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // URL変更が完了したときのみ処理
  if (changeInfo.status !== 'complete' || !tab.url) {
    return;
  }

  try {
    const url = new URL(tab.url);
    const hostname = url.hostname.replace('www.', '');
    
    // 設定を取得
    const data = await chrome.storage.sync.get([
      'settings',
      'blacklist',
      'whitelist',
      'cooldowns'
    ]);
    
    const settings = data.settings || DEFAULT_SETTINGS;
    const blacklist = data.blacklist || DEFAULT_BLACKLIST;
    const whitelist = data.whitelist || [];
    const cooldowns = data.cooldowns || {};
    
    // 機能が無効化されている場合はスキップ
    if (!settings.enabled) {
      return;
    }
    
    // ブラックリストにマッチするかチェック
    const isBlacklisted = blacklist.some(pattern => 
      hostname.includes(pattern) || pattern.includes(hostname)
    );
    
    if (!isBlacklisted) {
      return;
    }
    
    // ホワイトリストにマッチするかチェック（除外パターン）
    const isWhitelisted = whitelist.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url.href);
    });
    
    if (isWhitelisted) {
      return;
    }
    
    // クールダウン中かチェック
    const now = Date.now();
    const cooldownEnd = cooldowns[hostname];
    if (cooldownEnd && now < cooldownEnd) {
      console.log(`Cooldown active for ${hostname}`);
      return;
    }
    
    // Focus Session起動の確認を表示
    await showFocusConfirmation(tabId, hostname, settings);
    
  } catch (error) {
    console.error('Error processing URL:', error);
  }
});

// Focus Session起動の確認を表示
async function showFocusConfirmation(tabId, hostname, settings) {
  // Content scriptを注入して確認ダイアログを表示
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: showConfirmDialog,
      args: [hostname, settings.defaultSessionMinutes]
    });
  } catch (error) {
    console.error('Failed to inject content script:', error);
    // フォールバック: 通知を使用
    await showNotification(hostname, settings);
  }
}

// ページ内に確認ダイアログを表示する関数（タブ内で実行される）
function showConfirmDialog(hostname, defaultMinutes) {
  // すでにダイアログが表示されている場合はスキップ
  if (document.getElementById('raycast-focus-dialog')) {
    return;
  }
  
  // ダイアログを作成
  const dialog = document.createElement('div');
  dialog.id = 'raycast-focus-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 2px solid #FF6363;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 350px;
    animation: slideIn 0.3s ease-out;
  `;
  
  dialog.innerHTML = `
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      #raycast-focus-dialog h3 {
        margin: 0 0 10px 0;
        font-size: 18px;
        color: #333;
      }
      #raycast-focus-dialog p {
        margin: 0 0 15px 0;
        color: #666;
        font-size: 14px;
      }
      #raycast-focus-dialog button {
        padding: 8px 16px;
        margin: 5px 5px 5px 0;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }
      #raycast-focus-dialog .primary {
        background: #FF6363;
        color: white;
      }
      #raycast-focus-dialog .primary:hover {
        background: #FF4545;
      }
      #raycast-focus-dialog .secondary {
        background: #f0f0f0;
        color: #333;
      }
      #raycast-focus-dialog .secondary:hover {
        background: #e0e0e0;
      }
      #raycast-focus-dialog input {
        width: 60px;
        padding: 6px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin: 0 5px;
      }
    </style>
    <h3>🎯 Focus Session を開始しますか？</h3>
    <p><strong>${hostname}</strong> にアクセスしました</p>
    <div style="margin-bottom: 15px;">
      <input type="number" id="focus-minutes" value="${defaultMinutes}" min="1" max="180" />
      <span style="color: #666; font-size: 14px;">分</span>
    </div>
    <button class="primary" id="start-focus">Focus 開始</button>
    <button class="secondary" id="skip-focus">スキップ</button>
    <button class="secondary" id="exclude-site">このサイトを除外</button>
  `;
  
  document.body.appendChild(dialog);
  
  // イベントリスナーを設定
  document.getElementById('start-focus').addEventListener('click', () => {
    const minutes = document.getElementById('focus-minutes').value;
    chrome.runtime.sendMessage({
      action: 'startFocus',
      minutes: parseInt(minutes),
      hostname: hostname
    });
    dialog.remove();
  });
  
  document.getElementById('skip-focus').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'skipFocus',
      hostname: hostname
    });
    dialog.remove();
  });
  
  document.getElementById('exclude-site').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'excludeSite',
      hostname: hostname
    });
    dialog.remove();
  });
  
  // 10秒後に自動で閉じる
  setTimeout(() => {
    if (dialog.parentNode) {
      dialog.remove();
    }
  }, 10000);
}

// 通知を表示（フォールバック）
async function showNotification(hostname, settings) {
  const notificationId = await chrome.notifications.create({
    type: 'basic',
    title: 'Focus Session を開始しますか？',
    message: `${hostname} にアクセスしました`,
    buttons: [
      { title: `${settings.defaultSessionMinutes}分 Focus 開始` },
      { title: 'スキップ' }
    ],
    requireInteraction: true
  });
  
  // 通知のボタンクリックを処理
  chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
    if (notifId === notificationId) {
      if (buttonIndex === 0) {
        startFocusSession(settings.defaultSessionMinutes, hostname);
      } else {
        setSkipCooldown(hostname, settings.cooldownMinutes);
      }
      chrome.notifications.clear(notificationId);
    }
  });
}

// メッセージリスナー（content scriptからのメッセージを処理）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startFocus') {
    startFocusSession(message.minutes, message.hostname);
  } else if (message.action === 'skipFocus') {
    chrome.storage.sync.get('settings', (data) => {
      const settings = data.settings || DEFAULT_SETTINGS;
      setSkipCooldown(message.hostname, settings.cooldownMinutes);
    });
  } else if (message.action === 'excludeSite') {
    excludeSiteFromBlacklist(message.hostname);
  }
});

// Focus Sessionを開始
async function startFocusSession(minutes, hostname) {
  // 分を秒に変換
  const duration = minutes * 60;

  // Raycast Focus用のURL Schemeを構築
  const params = new URLSearchParams({
    goal: `Focus: ${hostname}`,
    duration: duration.toString(),
    mode: 'block'
  });

  const focusUrl = `raycast://focus/start?${params.toString()}`;

  // 統計を更新
  const { statistics } = await chrome.storage.sync.get('statistics');
  const stats = statistics || { totalSessions: 0, byDomain: {} };

  stats.totalSessions += 1;
  stats.byDomain[hostname] = (stats.byDomain[hostname] || 0) + 1;

  await chrome.storage.sync.set({ statistics: stats });

  // Raycast Focusを起動
  chrome.tabs.create({ url: focusUrl, active: false }, (tab) => {
    // タブを即座に閉じる（URL schemeが開かれたら不要）
    setTimeout(() => {
      chrome.tabs.remove(tab.id);
    }, 100);
  });

  console.log(`Raycast Focus session started: ${minutes} minutes for ${hostname}`);
}

// スキップ時のクールダウンを設定
async function setSkipCooldown(hostname, cooldownMinutes) {
  const { cooldowns } = await chrome.storage.sync.get('cooldowns');
  const updatedCooldowns = cooldowns || {};
  
  updatedCooldowns[hostname] = Date.now() + (cooldownMinutes * 60 * 1000);
  
  await chrome.storage.sync.set({ cooldowns: updatedCooldowns });
  console.log(`Cooldown set for ${hostname}: ${cooldownMinutes} minutes`);
}

// サイトをブラックリストから除外
async function excludeSiteFromBlacklist(hostname) {
  const { blacklist } = await chrome.storage.sync.get('blacklist');
  const updatedBlacklist = (blacklist || DEFAULT_BLACKLIST).filter(
    site => !hostname.includes(site) && !site.includes(hostname)
  );
  
  await chrome.storage.sync.set({ blacklist: updatedBlacklist });
  console.log(`Excluded ${hostname} from blacklist`);
}
