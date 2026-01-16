const params = new URLSearchParams(window.location.search);
const hostname = params.get('hostname') || '';
const minutesParam = parseInt(params.get('minutes'), 10);

const hostnameEl = document.getElementById('hostname');
const minutesInput = document.getElementById('focusMinutes');
const categoryInfo = document.getElementById('categoryInfo');
const categoryWarning = document.getElementById('categoryWarning');
const categoryTags = document.getElementById('categoryTags');

const CATEGORY_OPTIONS = [
  'Messaging',
  'Gaming',
  'Shopping',
  'Social',
  'Streaming',
  'News',
  'Travel',
  'Viving',
  '開くな！！！！',
  '作業',
  'block'
];

hostnameEl.textContent = hostname || '-';

const selectedCategories = new Set();

const toggleCategory = (category, tagEl) => {
  if (selectedCategories.has(category)) {
    selectedCategories.delete(category);
    tagEl.classList.remove('selected');
  } else {
    selectedCategories.add(category);
    tagEl.classList.add('selected');
  }
};

const populateCategoryOptions = () => {
  categoryTags.innerHTML = '';
  CATEGORY_OPTIONS.forEach((category) => {
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = 'tag';
    tag.textContent = category;
    tag.addEventListener('click', () => toggleCategory(category, tag));
    categoryTags.appendChild(tag);
  });
};

const normalizeCategories = (value) => {
  if (!value) return '';
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',');
};

const resolveCategories = (host, blacklist, siteCategories, siteRules) => {
  let matchedSite = null;
  (blacklist || []).forEach((key) => {
    if (host.includes(key) || key.includes(host)) {
      if (!matchedSite || key.length > matchedSite.length) {
        matchedSite = key;
      }
    }
  });

  if (!matchedSite) return '';

  const rule = siteRules[matchedSite];
  if (!rule || rule.blockCategories !== true) {
    return '';
  }
  return normalizeCategories(siteCategories[matchedSite]);
};

const loadSettings = async () => {
  const { settings, blacklist, siteCategories, siteRules } = await chrome.storage.sync.get([
    'settings',
    'blacklist',
    'siteCategories',
    'siteRules'
  ]);

  const fallbackMinutes = settings?.defaultSessionMinutes || 25;
  minutesInput.value = Number.isFinite(minutesParam) ? minutesParam : fallbackMinutes;

  const categories = resolveCategories(
    hostname,
    blacklist || [],
    siteCategories || {},
    siteRules || {}
  );

  if (categories) {
    categoryInfo.textContent = `カテゴリブロック: ${categories}`;
    categoryWarning.textContent = '';
  } else {
    categoryInfo.textContent = 'カテゴリブロック: なし';
    categoryWarning.textContent = 'カテゴリをブロックする場合は設定画面で「カテゴリブロック」をオンにしてください。';
  }

  return categories;
};

let resolvedCategories = '';
populateCategoryOptions();
loadSettings().then((categories) => {
  resolvedCategories = categories;
  if (resolvedCategories) {
    resolvedCategories.split(',').forEach((category) => {
      selectedCategories.add(category);
      const tag = Array.from(categoryTags.children).find((el) => el.textContent === category);
      if (tag) {
        tag.classList.add('selected');
      }
    });
  }
});

const closeCurrentTab = () => {
  chrome.tabs.getCurrent((tab) => {
    if (tab && tab.id) {
      chrome.tabs.remove(tab.id);
    }
  });
};

const buildFocusUrl = (minutes) => {
  const duration = minutes * 60;
  const chosenCategories =
    normalizeCategories(Array.from(selectedCategories).join(',')) || resolvedCategories;
  const params = new URLSearchParams({
    goal: `Focus: ${hostname}`,
    duration: duration.toString(),
    mode: 'block'
  });
  params.set('categories', chosenCategories || '');
  return `raycast://focus/start?${params.toString()}`;
};

const startFocus = async () => {
  const minutes = parseInt(minutesInput.value, 10);
  if (!minutes || minutes < 1) return;

  const chosenCategories = normalizeCategories(Array.from(selectedCategories).join(',')) || resolvedCategories;
  if (!chosenCategories) {
    categoryWarning.textContent = 'カテゴリが未選択です。カテゴリを1つ以上選択してください。';
    return;
  }
  categoryWarning.textContent = '';

  chrome.runtime.sendMessage({ action: 'recordFocusStart', hostname });
  const focusUrl = buildFocusUrl(minutes);
  try {
    await chrome.tabs.create({ url: focusUrl, active: true });
    setTimeout(closeCurrentTab, 1500);
  } catch (error) {
    console.error('Failed to open Raycast Focus:', error);
  }
};

const skipFocus = () => {
  chrome.runtime.sendMessage({ action: 'skipFocus', hostname });
  closeCurrentTab();
};

const excludeSite = () => {
  chrome.runtime.sendMessage({ action: 'excludeSite', hostname });
  closeCurrentTab();
};

const openSettings = () => {
  chrome.runtime.openOptionsPage();
};

// イベント

document.getElementById('startFocus').addEventListener('click', startFocus);
document.getElementById('skipFocus').addEventListener('click', skipFocus);
document.getElementById('excludeSite').addEventListener('click', excludeSite);
document.getElementById('openSettings').addEventListener('click', openSettings);
