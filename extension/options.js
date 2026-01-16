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
  const { blacklist, siteCategories, siteRules } = await chrome.storage.sync.get([
    'blacklist',
    'siteCategories',
    'siteRules'
  ]);
  const container = document.getElementById('blacklistContainer');
  container.innerHTML = '';
  
  if (blacklist && blacklist.length > 0) {
    blacklist.forEach(site => {
      const categories = (siteCategories && siteCategories[site]) || '';
      const rules = (siteRules && siteRules[site]) || {};
      const item = createBlacklistItem(site, categories, rules);
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

// ブラックリスト用のリストアイテムを作成（カテゴリ入力付き）
function createBlacklistItem(site, categories, rules) {
  const item = document.createElement('div');
  item.className = 'list-item';

  const siteLabel = document.createElement('span');
  siteLabel.className = 'site-label';
  siteLabel.textContent = site;

  const focusGroup = document.createElement('label');
  focusGroup.className = 'checkbox-group';
  const focusCheckbox = document.createElement('input');
  focusCheckbox.type = 'checkbox';
  focusCheckbox.checked = rules.enabled !== false;
  const focusText = document.createElement('span');
  focusText.textContent = 'Focus対象';
  focusGroup.appendChild(focusCheckbox);
  focusGroup.appendChild(focusText);

  const categoryGroup = document.createElement('label');
  categoryGroup.className = 'checkbox-group';
  const categoryCheckbox = document.createElement('input');
  categoryCheckbox.type = 'checkbox';
  categoryCheckbox.checked = rules.blockCategories === true;
  const categoryText = document.createElement('span');
  categoryText.textContent = 'カテゴリブロック';
  categoryGroup.appendChild(categoryCheckbox);
  categoryGroup.appendChild(categoryText);

  const input = document.createElement('input');
  input.className = 'category-input';
  input.type = 'text';
  input.placeholder = 'カテゴリ（例: social,video）';
  input.value = categories;
  input.disabled = !categoryCheckbox.checked;
  input.addEventListener('change', async () => {
    const { siteCategories } = await chrome.storage.sync.get('siteCategories');
    const updated = siteCategories || {};
    const normalized = input.value
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .join(',');

    input.value = normalized;

    if (normalized) {
      updated[site] = normalized;
    } else {
      delete updated[site];
    }

    await chrome.storage.sync.set({ siteCategories: updated });
    showToast('カテゴリを保存しました');
  });

  focusCheckbox.addEventListener('change', async () => {
    const { siteRules } = await chrome.storage.sync.get('siteRules');
    const updated = siteRules || {};
    const current = updated[site] || {};
    updated[site] = {
      ...current,
      enabled: focusCheckbox.checked
    };
    await chrome.storage.sync.set({ siteRules: updated });
    showToast('Focus対象を更新しました');
  });

  categoryCheckbox.addEventListener('change', async () => {
    const { siteRules } = await chrome.storage.sync.get('siteRules');
    const updated = siteRules || {};
    const current = updated[site] || {};
    updated[site] = {
      ...current,
      blockCategories: categoryCheckbox.checked
    };
    input.disabled = !categoryCheckbox.checked;
    await chrome.storage.sync.set({ siteRules: updated });
    showToast('カテゴリブロックを更新しました');
  });

  const button = document.createElement('button');
  button.className = 'remove-btn';
  button.textContent = '削除';
  button.addEventListener('click', () => removeFromBlacklist(site));

  item.appendChild(siteLabel);
  item.appendChild(focusGroup);
  item.appendChild(categoryGroup);
  item.appendChild(input);
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
      const { blacklist, siteRules } = await chrome.storage.sync.get(['blacklist', 'siteRules']);
      const updatedList = [...(blacklist || []), value];
      const updatedRules = siteRules || {};
      if (!updatedRules[value]) {
        updatedRules[value] = { enabled: true, blockCategories: false };
      }
      
      await chrome.storage.sync.set({ blacklist: updatedList, siteRules: updatedRules });
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
    showToast('設定を保存しました');
  });

  // カテゴリJSONをダウンロード
  const downloadButton = document.getElementById('downloadCategoriesJson');
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadCategoriesJson);
  }
}

// ブラックリストから削除
async function removeFromBlacklist(site) {
  const { blacklist, siteCategories, siteRules } = await chrome.storage.sync.get([
    'blacklist',
    'siteCategories',
    'siteRules'
  ]);
  const updatedList = blacklist.filter(item => item !== site);

  const updatedCategories = siteCategories || {};
  delete updatedCategories[site];

  const updatedRules = siteRules || {};
  delete updatedRules[site];
  
  await chrome.storage.sync.set({
    blacklist: updatedList,
    siteCategories: updatedCategories,
    siteRules: updatedRules
  });
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
function showToast(message) {
  const toast = document.getElementById('toast');
  if (message) {
    toast.textContent = `✓ ${message}`;
  }
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

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

async function downloadCategoriesJson() {
  const { blacklist, siteCategories, siteRules } = await chrome.storage.sync.get([
    'blacklist',
    'siteCategories',
    'siteRules'
  ]);

  const categoriesMap = new Map();
  (blacklist || []).forEach((site) => {
    const rules = (siteRules && siteRules[site]) || {};
    if (rules.enabled === false || rules.blockCategories !== true) {
      return;
    }

    const rawCategories = siteCategories ? siteCategories[site] : '';
    const normalized = normalizeCategories(rawCategories);
    if (!normalized) {
      return;
    }

    normalized.split(',').forEach((category) => {
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, new Set());
      }
      categoriesMap.get(category).add(site);
    });
  });

  if (categoriesMap.size === 0) {
    alert('カテゴリブロックが有効なサイトがありません。');
    return;
  }

  const categories = Array.from(categoriesMap.entries()).map(([title, sites]) => ({
    title,
    websites: Array.from(sites).sort()
  }));

  const json = JSON.stringify(categories, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'raycast-focus-categories.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
