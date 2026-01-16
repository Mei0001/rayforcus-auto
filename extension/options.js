// ページ読み込み時に設定を読み込む
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadBlacklist();
  await loadWhitelist();
  await loadStatistics();
  setupEventListeners();
});

// 設定を読み込む
async function loadSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  
  if (settings) {
    document.getElementById('defaultMinutes').value = settings.defaultSessionMinutes;
    document.getElementById('cooldownMinutes').value = settings.cooldownMinutes;
    document.getElementById('confirmationDelay').value = settings.confirmationDelay;
  }
}

// ブラックリストを読み込む
async function loadBlacklist() {
  const { blacklist } = await chrome.storage.sync.get('blacklist');
  const container = document.getElementById('blacklistContainer');
  container.innerHTML = '';
  
  if (blacklist && blacklist.length > 0) {
    blacklist.forEach(site => {
      const item = createListItem(site, () => removeFromBlacklist(site));
      container.appendChild(item);
    });
  } else {
    container.innerHTML = '<p style="color: #999; font-size: 13px; padding: 10px;">リストが空です</p>';
  }
}

// ホワイトリストを読み込む
async function loadWhitelist() {
  const { whitelist } = await chrome.storage.sync.get('whitelist');
  const container = document.getElementById('whitelistContainer');
  container.innerHTML = '';
  
  if (whitelist && whitelist.length > 0) {
    whitelist.forEach(pattern => {
      const item = createListItem(pattern, () => removeFromWhitelist(pattern));
      container.appendChild(item);
    });
  } else {
    container.innerHTML = '<p style="color: #999; font-size: 13px; padding: 10px;">リストが空です</p>';
  }
}

// 統計情報を読み込む
async function loadStatistics() {
  const { statistics } = await chrome.storage.sync.get('statistics');
  
  if (statistics) {
    document.getElementById('totalSessions').textContent = statistics.totalSessions || 0;
    
    // ドメイン別統計を表示
    const container = document.getElementById('domainStatsContainer');
    container.innerHTML = '';
    
    if (statistics.byDomain && Object.keys(statistics.byDomain).length > 0) {
      const title = document.createElement('h3');
      title.textContent = 'サイト別セッション数';
      title.style.fontSize = '16px';
      title.style.marginBottom = '10px';
      container.appendChild(title);
      
      const sorted = Object.entries(statistics.byDomain).sort((a, b) => b[1] - a[1]);
      
      sorted.forEach(([domain, count]) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <span>${domain}</span>
          <span style="font-weight: 600; color: #FF6363;">${count}回</span>
        `;
        container.appendChild(item);
      });
    }
  }
}

// リストアイテムを作成
function createListItem(text, onRemove) {
  const item = document.createElement('div');
  item.className = 'list-item';
  
  const span = document.createElement('span');
  span.textContent = text;
  
  const button = document.createElement('button');
  button.className = 'remove-btn';
  button.textContent = '削除';
  button.addEventListener('click', onRemove);
  
  item.appendChild(span);
  item.appendChild(button);
  
  return item;
}

// イベントリスナーを設定
function setupEventListeners() {
  // ブラックリストに追加
  document.getElementById('addBlacklist').addEventListener('click', async () => {
    const input = document.getElementById('newBlacklistItem');
    const value = input.value.trim();
    
    if (value) {
      const { blacklist } = await chrome.storage.sync.get('blacklist');
      const updatedList = [...(blacklist || []), value];
      
      await chrome.storage.sync.set({ blacklist: updatedList });
      input.value = '';
      await loadBlacklist();
    }
  });
  
  // Enterキーでも追加
  document.getElementById('newBlacklistItem').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('addBlacklist').click();
    }
  });
  
  // ホワイトリストに追加
  document.getElementById('addWhitelist').addEventListener('click', async () => {
    const input = document.getElementById('newWhitelistItem');
    const value = input.value.trim();
    
    if (value) {
      const { whitelist } = await chrome.storage.sync.get('whitelist');
      const updatedList = [...(whitelist || []), value];
      
      await chrome.storage.sync.set({ whitelist: updatedList });
      input.value = '';
      await loadWhitelist();
    }
  });
  
  // Enterキーでも追加
  document.getElementById('newWhitelistItem').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('addWhitelist').click();
    }
  });
  
  // 保存ボタン
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const { settings } = await chrome.storage.sync.get('settings');
    
    settings.defaultSessionMinutes = parseInt(document.getElementById('defaultMinutes').value);
    settings.cooldownMinutes = parseInt(document.getElementById('cooldownMinutes').value);
    settings.confirmationDelay = parseInt(document.getElementById('confirmationDelay').value);
    
    await chrome.storage.sync.set({ settings });
    
    // トーストを表示
    showToast();
  });
}

// ブラックリストから削除
async function removeFromBlacklist(site) {
  const { blacklist } = await chrome.storage.sync.get('blacklist');
  const updatedList = blacklist.filter(item => item !== site);
  
  await chrome.storage.sync.set({ blacklist: updatedList });
  await loadBlacklist();
}

// ホワイトリストから削除
async function removeFromWhitelist(pattern) {
  const { whitelist } = await chrome.storage.sync.get('whitelist');
  const updatedList = whitelist.filter(item => item !== pattern);
  
  await chrome.storage.sync.set({ whitelist: updatedList });
  await loadWhitelist();
}

// トーストを表示
function showToast() {
  const toast = document.getElementById('toast');
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}
