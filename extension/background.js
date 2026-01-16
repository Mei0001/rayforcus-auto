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
      siteRules: {},
      siteCategories: {},
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

  // 特殊なURLをスキップ（about:blank, chrome://, edge://, etc.）
  if (tab.url.startsWith('about:') ||
      tab.url.startsWith('chrome:') ||
      tab.url.startsWith('chrome-extension:') ||
      tab.url.startsWith('edge:') ||
      tab.url.startsWith('file:')) {
    return;
  }

  try {
    const url = new URL(tab.url);
    const hostname = url.hostname.replace('www.', '');

    // hostnameが空の場合もスキップ
    if (!hostname) {
      return;
    }
    
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
    
    const matchedSite = findMatchingSite(hostname, blacklist);

    if (!matchedSite) {
      return;
    }

    const { siteRules } = await chrome.storage.sync.get('siteRules');
    const rules = siteRules || {};
    const siteRule = rules[matchedSite];

    if (siteRule && siteRule.enabled === false) {
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
  const delayMs = (settings.confirmationDelay || 0) * 1000;
  const confirmUrl = chrome.runtime.getURL(
    `confirm.html?hostname=${encodeURIComponent(hostname)}&minutes=${settings.defaultSessionMinutes}`
  );

  const openConfirmTab = async () => {
    try {
      const existingTabs = await chrome.tabs.query({ url: `${chrome.runtime.getURL('confirm.html')}*` });
      const alreadyOpen = existingTabs.some((tab) => tab.url && tab.url.includes(`hostname=${encodeURIComponent(hostname)}`));
      if (alreadyOpen) {
        return;
      }
      await chrome.tabs.create({ url: confirmUrl, active: true });
    } catch (error) {
      console.error('Failed to open confirmation page:', error);
      await showNotification(hostname, settings);
    }
  };

  if (delayMs > 0) {
    setTimeout(openConfirmTab, delayMs);
  } else {
    await openConfirmTab();
  }
}

// 通知を表示（フォールバック）
async function showNotification(hostname, settings) {
  // 小さな透明なPNG（Data URI）
  const iconDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const notificationId = await chrome.notifications.create({
    type: 'basic',
    iconUrl: iconDataUrl,
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
  } else if (message.action === 'recordFocusStart') {
    incrementStatistics(message.hostname);
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

  const { siteCategories, siteRules, blacklist } = await chrome.storage.sync.get([
    'siteCategories',
    'siteRules',
    'blacklist'
  ]);
  const categories = resolveCategoriesForHost(
    hostname,
    siteCategories || {},
    siteRules || {},
    blacklist || DEFAULT_BLACKLIST
  );

  // Raycast Focus用のURL Schemeを構築
  const params = new URLSearchParams({
    goal: `Focus: ${hostname}`,
    duration: duration.toString(),
    mode: 'block'
  });

  if (categories) {
    params.set('categories', categories);
  }

  const focusUrl = `raycast://focus/start?${params.toString()}`;

  // デバッグ用ログ
  console.log(`Opening Raycast Focus with URL: ${focusUrl}`);

  // 統計を更新
  await incrementStatistics(hostname);

  // Raycast Focusを起動（より確実な方法）
  try {
    // 新しいタブを作成してURL Schemeを開く
    const tab = await chrome.tabs.create({ url: focusUrl, active: true });

    // タブが作成されたら、少し待ってから閉じる
    setTimeout(async () => {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        // タブが既に閉じられている場合は無視
        console.log('Tab already closed');
      }
    }, 500);

    console.log(`Raycast Focus session started: ${minutes} minutes for ${hostname}`);
  } catch (error) {
    console.error('Failed to open Raycast Focus:', error);

    // フォールバック: chrome.tabs.updateを試す
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.update(tabs[0].id, { url: focusUrl });
      }
    });
  }
}

// 統計を更新
async function incrementStatistics(hostname) {
  const { statistics } = await chrome.storage.sync.get('statistics');
  const stats = statistics || { totalSessions: 0, byDomain: {} };

  stats.totalSessions += 1;
  stats.byDomain[hostname] = (stats.byDomain[hostname] || 0) + 1;

  await chrome.storage.sync.set({ statistics: stats });
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
  const { blacklist, siteCategories, siteRules } = await chrome.storage.sync.get([
    'blacklist',
    'siteCategories',
    'siteRules'
  ]);
  const updatedBlacklist = (blacklist || DEFAULT_BLACKLIST).filter(
    site => !hostname.includes(site) && !site.includes(hostname)
  );

  const updatedCategories = siteCategories || {};
  Object.keys(updatedCategories).forEach((key) => {
    if (hostname.includes(key) || key.includes(hostname)) {
      delete updatedCategories[key];
    }
  });

  const updatedRules = siteRules || {};
  Object.keys(updatedRules).forEach((key) => {
    if (hostname.includes(key) || key.includes(hostname)) {
      delete updatedRules[key];
    }
  });
  
  await chrome.storage.sync.set({
    blacklist: updatedBlacklist,
    siteCategories: updatedCategories,
    siteRules: updatedRules
  });
  console.log(`Excluded ${hostname} from blacklist`);
}

// ホスト名に一致するカテゴリを解決
function findMatchingCategories(hostname, siteCategories) {
  let bestKey = null;
  Object.keys(siteCategories).forEach((key) => {
    if (hostname.includes(key) || key.includes(hostname)) {
      if (!bestKey || key.length > bestKey.length) {
        bestKey = key;
      }
    }
  });

  return bestKey ? siteCategories[bestKey] : '';
}

// ブラックリストに一致するキーを解決
function findMatchingSite(hostname, blacklist) {
  let bestKey = null;
  (blacklist || []).forEach((key) => {
    if (hostname.includes(key) || key.includes(hostname)) {
      if (!bestKey || key.length > bestKey.length) {
        bestKey = key;
      }
    }
  });

  return bestKey;
}

// categories の書式を正規化（カンマ区切り・空白削除）
function normalizeCategories(value) {
  if (!value) {
    return '';
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',');
}

// ルールに応じてカテゴリを解決
function resolveCategoriesForHost(hostname, siteCategories, siteRules, blacklist) {
  const matchedSite = findMatchingSite(hostname, blacklist);
  if (!matchedSite) {
    return '';
  }
  const rule = siteRules[matchedSite];
  if (!rule || rule.blockCategories !== true) {
    return '';
  }
  return normalizeCategories(siteCategories[matchedSite]);
}
