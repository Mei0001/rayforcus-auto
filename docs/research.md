# Raycast Focus Session リサーチ

## 概要

Raycast Focusは、集中力を高めるために気を散らすアプリやウェブサイトをブロックする機能です。Raycast v1.89.0で導入され、無料で使用できます。ユーザーは目標を設定し、期間を指定し、ブロック/許可モードを選択して集中セッションを開始できます。

Focus機能は、単なるブロックツールではなく、進捗を追跡し、必要に応じて一時停止できるフローティングバー（Focus Bar）を提供します。また、システムのFocusフィルター、Apple Shortcutsと統合して、ワークフローを自動化できます。

## 機能

### 主要機能

1. **Focus Session管理**
   - セッション目標の設定（自然言語対応）
   - 柔軟な期間設定：5分〜1日、または「4:30pmまで」などの自然言語表現
   - セッションの開始、一時停止、完了、編集

2. **ブロック/許可モード**
   - **Block Mode（ブロックモード）**: 指定したアプリ/ウェブサイトのみをブロック
   - **Allow Mode（許可モード）**: 指定したアプリ/ウェブサイト以外すべてをブロック

3. **Focus Categories（フォーカスカテゴリ）**
   - カスタムカテゴリの作成：ワークフローに合わせてアプリとウェブサイトをグループ化
   - 組み込みカテゴリ：Raycastが提供（編集不可、複製して別名で保存可能）
   - カテゴリのインポート・エクスポート

4. **Focus Bar（フォーカスバー）**
   - すべてのウィンドウの上に表示されるフローティングバー
   - 進捗の追跡、セッションの管理
   - スヌーズ機能：ブロックされたコンテンツへの一時的なアクセス（デフォルト3分）

5. **システム統合**
   - macOSシステムFocusとの連携
   - Apple Shortcutsによる自動化対応

### 利用可能なコマンド

- Start Focus Session（フォーカスセッション開始）
- Toggle Focus Session（フォーカスセッショントグル）
- Complete Focus Session（フォーカスセッション完了）
- Pause Focus Session（フォーカスセッション一時停止）
- Edit Focus Session（フォーカスセッション編集）
- Create Focus Category（フォーカスカテゴリ作成）
- Search Focus Category（フォーカスカテゴリ検索）
- Import Focus Categories（フォーカスカテゴリインポート）

## 起動方法

### 1. Raycast内から起動

- `⌘ + Space`でRaycastを開く
- 「Start Focus Session」と入力してコマンドを実行
- 目標、期間、カテゴリ、モードを設定

### 2. キーボードショートカット

- Raycast設定でカスタムキーボードショートカットを割り当て可能
- 例：`⌘⌥F`で直接Start Focus Sessionコマンドを起動

### 3. Apple Shortcuts経由

Raycastが提供するショートカット：
- **Start Focus Session**: セッションを開始
- **Complete Focus Session**: セッションを完了

これらをiOS/macOSのショートカットアプリで自動化ワークフローに組み込み可能。

### 4. URL Scheme（Deeplinks）経由

外部アプリケーションやスクリプトから起動可能（後述）。

## 外部からの制御

### Chrome拡張からの制御

Chrome拡張からRaycast Focus Sessionを起動するには、URL Schemeを使用します。

**実装方法:**

```javascript
// Raycast Focus Sessionを起動する関数
function startRaycastFocusSession(options = {}) {
  const {
    goal = 'Focus Time',
    duration = 1500,  // 秒単位（25分 = 1500秒）
    categories = '',   // カンマ区切り（例: 'social,gaming'）
    mode = 'block'     // 'block' または 'allow'
  } = options;

  // URLパラメータを構築
  const params = new URLSearchParams();
  if (goal) params.append('goal', goal);
  if (duration) params.append('duration', duration);
  if (categories) params.append('categories', categories);
  if (mode) params.append('mode', mode);

  const focusUrl = `raycast://focus/start?${params.toString()}`;

  // 新しいタブでURL Schemeを開く（即座に閉じる）
  chrome.tabs.create({ url: focusUrl, active: false }, (tab) => {
    setTimeout(() => {
      chrome.tabs.remove(tab.id);
    }, 100);
  });
}

// 使用例
startRaycastFocusSession({
  goal: 'Deep Work',
  duration: 3600,        // 60分
  categories: 'social',  // ソーシャルメディアをブロック
  mode: 'block'
});
```

**注意点:**

- URL Schemeを介してコマンドを起動する場合、Raycastは確認ダイアログを表示します（セキュリティ対策）
- ユーザーは「実行する」を選択する必要があります
- 完全に自動化するには、ユーザーの事前設定や承認が必要

### 他の外部制御方法

1. **シェルスクリプト**
   ```bash
   # 25分のFocus Session開始
   open "raycast://focus/start?goal=Coding&duration=1500&mode=block"
   ```

2. **AppleScript経由**
   ```applescript
   do shell script "open 'raycast://focus/start?goal=Writing&duration=2700'"
   ```

3. **Alfred、Keyboard Maestro等のランチャー**
   - URL Schemeを実行するワークフローを作成

## URL Scheme / API

### 基本フォーマット

```
raycast://focus/<action>?<parameters>
```

### 利用可能なアクション

#### 1. Start Focus Session（セッション開始）

```
raycast://focus/start?goal=<goal>&duration=<seconds>&categories=<categories>&mode=<mode>
```

**パラメータ:**

| パラメータ | 型 | 説明 | 例 |
|----------|---|------|---|
| `goal` | string (オプション) | セッションの目標や名前 | `Deep%20Work`, `Coding` |
| `duration` | integer (オプション) | セッション期間（秒単位） | `1500`（25分）、`3600`（60分） |
| `categories` | string (オプション) | ブロック/許可するカテゴリ（カンマ区切り） | `social,gaming`, `work` |
| `mode` | string (オプション) | フィルタリングモード | `block` または `allow` |

**例:**

```
# 基本的な使用
raycast://focus/start?goal=Focus%20Time&duration=1500

# カテゴリ指定
raycast://focus/start?goal=Deep%20Work&categories=social,gaming&mode=block

# 許可モード（仕事関連のみ許可）
raycast://focus/start?goal=Work%20Time&categories=work&mode=allow
```

#### 2. Toggle Focus Session（セッショントグル）

```
raycast://focus/toggle?goal=<goal>&duration=<seconds>&categories=<categories>&mode=<mode>
```

- セッションが実行中でない場合：指定されたパラメータで新しいセッションを開始
- セッションが実行中の場合：現在のセッションを完了

**パラメータ:** `start`と同じ

#### 3. Complete Focus Session（セッション完了）

```
raycast://focus/complete
```

現在実行中のFocus Sessionを完了します。パラメータは不要です。

### Deeplinksの取得方法

Raycast内から特定のコマンドのDeeplinkをコピーする方法：

1. Raycastを開く（`⌘ + Space`）
2. 任意のコマンドを見つける
3. `⌘K`でアクションメニューを開く
4. 「Copy Deeplink」を選択（または`⌘⇧C`）
5. クリップボードにDeeplink URLがコピーされる

### セキュリティ考慮事項

- Deeplinkを介してコマンドを起動すると、Raycastは実行確認ダイアログを表示します
- これはセキュリティ対策であり、悪意のあるウェブサイトやアプリが勝手にコマンドを実行するのを防ぎます
- ユーザーは毎回確認する必要があります（現時点では自動承認の方法はなし）

## 設定項目

### Focus Session設定

Raycast設定（`⌘,`）> Focus セクション：

1. **デフォルトセッション期間**
   - 新しいセッションのデフォルト時間を設定

2. **スヌーズ期間**
   - ブロックされたコンテンツへの一時アクセス時間（デフォルト3分）

3. **Focus Categories**
   - カスタムカテゴリの作成・編集
   - アプリとウェブサイトのグループ化

4. **Focus Filter（システム統合）**
   - macOSシステムFocusと連携してFocus Sessionを自動開始

5. **通知設定**
   - セッション開始・終了時の通知

### カスタムカテゴリの作成

カテゴリを作成することで、よく使うブロック/許可リストを再利用可能：

1. Raycast内で「Create Focus Category」を実行
2. カテゴリ名を入力
3. ブロック/許可するアプリとウェブサイトを追加
4. 保存

作成したカテゴリは、URL Schemeの`categories`パラメータで使用可能。

## 参考リンク

### 公式ドキュメント

- [Raycast Focus 機能ページ](https://www.raycast.com/core-features/focus)
- [Raycast Focus マニュアル](https://manual.raycast.com/focus)
- [Raycast Deeplinks ドキュメント](https://manual.raycast.com/deeplinks)
- [Raycast API - Deeplinks](https://developers.raycast.com/information/lifecycle/deeplinks)

### リリース情報

- [Raycast v1.89.0 - Raycast Focus 導入](https://www.raycast.com/changelog/1-89-0)
- [Raycast v1.92.0 - カスタムフォーカスカテゴリ](https://www.raycast.com/changelog/1-92-0)
- [Raycast v1.47.0 - Deeplinks 導入](https://www.raycast.com/changelog/1-47-0)

### GitHubリポジトリ

- [raycast/extensions - 公式拡張機能リポジトリ](https://github.com/raycast/extensions)
- [raycast/script-commands - スクリプトコマンド集](https://github.com/raycast/script-commands)
  - [Focus関連スクリプト例](https://github.com/raycast/script-commands/tree/master/commands/apps/focus)

### 関連拡張機能

- [RescueTime Focus Session Trigger](https://www.raycast.com/TuorTheBlessed/rescuetime-focus-session-trigger) - RescueTime連携
- [Raycast Focus Stats](https://www.raycast.com/dinocosta/raycast-focus-stats) - Focus統計の表示
- [Session - Pomodoro Focus Timer](https://www.raycast.com/jameslyons/session) - ポモドーロタイマー

### その他のリソース

- [Raycast Browser Extension](https://www.raycast.com/browser-extension) - ブラウザとの統合
- [Raycast Companion - Chrome拡張](https://chromewebstore.google.com/detail/raycast-companion/fgacdjnoljjfikkadhogeofgjoglooma)

## 実装への影響

### 現在のChrome拡張の問題点

現在の `/Users/mei/rayforcus-auto/extension/background.js` では、**間違ったURL Scheme**を使用しています：

```javascript
// ❌ 現在のコード（間違い）
const focusUrl = `focus://focus?minutes=${minutes}`;
```

これは「Focus」という別のアプリ（[heyfocus.com](https://heyfocus.com)）のURL Schemeです。**Raycast Focusではありません。**

### 修正が必要な箇所

#### 1. URL Schemeの修正

**background.js の `startFocusSession` 関数を修正:**

```javascript
// ✅ 修正後のコード
async function startFocusSession(minutes, hostname) {
  // 分を秒に変換
  const duration = minutes * 60;

  // Raycast Focus用のURL Schemeを構築
  const params = new URLSearchParams({
    goal: `Focus: ${hostname}`,
    duration: duration.toString(),
    mode: 'block'
    // categories: 'social' などを追加可能
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
    setTimeout(() => {
      chrome.tabs.remove(tab.id);
    }, 100);
  });

  console.log(`Raycast Focus session started: ${minutes} minutes for ${hostname}`);
}
```

#### 2. popup.js の修正

**popup.js の手動Focus開始も同様に修正:**

```javascript
// ✅ 修正後のコード
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
```

### 新機能の追加検討

#### 1. カテゴリ指定機能

Focus Categoriesを活用して、より細かいブロック制御を実装：

```javascript
// 設定にカテゴリマッピングを追加
const DOMAIN_CATEGORY_MAP = {
  'youtube.com': 'social,entertainment',
  'twitter.com': 'social',
  'x.com': 'social',
  'facebook.com': 'social',
  'reddit.com': 'social',
  'netflix.com': 'entertainment',
  // ...
};

async function startFocusSession(minutes, hostname) {
  const duration = minutes * 60;
  const categories = DOMAIN_CATEGORY_MAP[hostname] || '';

  const params = new URLSearchParams({
    goal: `Focus: ${hostname}`,
    duration: duration.toString(),
    categories: categories,
    mode: 'block'
  });

  const focusUrl = `raycast://focus/start?${params.toString()}`;
  // ...
}
```

#### 2. ブロック/許可モードの選択

設定で「Block Mode」と「Allow Mode」を切り替え可能に：

```javascript
// settings に focusMode を追加
const DEFAULT_SETTINGS = {
  enabled: true,
  defaultSessionMinutes: 25,
  confirmationDelay: 0,
  preventDuplicates: true,
  cooldownMinutes: 30,
  focusMode: 'block'  // 'block' or 'allow'
};
```

#### 3. ユーザー確認の改善

Raycast DeeplinkはセキュリティのためユーザーConfirmationが必要です。これを考慮したUX改善：

- ダイアログに「Raycastで確認が必要です」と表示
- 初回起動時に説明を表示
- README.mdに使用方法を記載

### 推奨する実装手順

1. **URL Schemeを修正** (`background.js`, `popup.js`)
2. **テスト実施** - 実際にRaycast Focusが起動するか確認
3. **設定画面を拡張** (`options.html`, `options.js`)
   - Focus Mode選択（Block/Allow）
   - カテゴリマッピング設定
4. **ドキュメント更新** (`extension/README.md`)
   - Raycast Focusのインストールが必要と明記
   - Deeplink確認ダイアログについて説明
5. **UI改善**
   - 確認ダイアログに注意書きを追加
   - 統計画面の改善

### 互換性確認

- **必須要件**: Raycast v1.89.0以降がインストールされていること
- **動作環境**: macOSのみ（RaycastはmacOS専用アプリ）
- **ブラウザ**: Chrome、Edge、その他Chromium系ブラウザ

### ユーザーへの案内

README.mdやextension説明に以下を記載すべき：

```markdown
## 必要要件

- macOS
- [Raycast](https://www.raycast.com/) v1.89.0以降

## セットアップ

1. Raycastをインストール
2. Chrome拡張をインストール
3. 拡張機能のアイコンをクリックして設定
4. 対象サイトにアクセスすると自動的にRaycast Focusが起動

## 注意事項

- 初回起動時、RaycastはDeeplinkの実行確認を求めます
- 「実行する」を選択してください
- セキュリティのため、毎回確認ダイアログが表示されます
```

## まとめ

Raycast Focus Sessionは、強力な集中管理機能を提供し、URL Scheme（Deeplinks）を通じて外部から制御可能です。現在のChrome拡張は、正しいURL Scheme（`raycast://focus/start`）に修正することで、Raycast Focusと連携できるようになります。

ただし、セキュリティ上の理由から、ユーザーはDeeplinkの実行を毎回確認する必要があります。これは仕様であり、回避することはできません。この点をユーザーに明確に伝えることが重要です。

---

## 調査メモ: categories 指定で Focus が開かない場合

### 現象
`raycast://focus/start?...&categories=...&mode=block` を使った場合に、Raycast Focus Session が起動しないことがある。

### 公式ドキュメント確認（2026-01-16）
Raycast Manual の Focus ページに Deeplink 仕様が明記されている。  
`raycast://focus/start` と `raycast://focus/toggle` の両方が利用可能で、`categories` は「アプリ/サイトカテゴリのカンマ区切り」として必須パラメータとして示されている。  
Start は「セッションがアクティブな場合は何もしない」と明記されている。  
参照: https://manual.raycast.com/focus?via=cm

#### 正しいURL例（公式記載）
- `raycast://focus/start?goal=Deep%20Focus&categories=social,gaming&duration=300&mode=block`
- `raycast://focus/toggle?goal=Deep%20Focus&categories=social,gaming&duration=300&mode=block`

### 有力な原因
1. **Raycast側に同名カテゴリが存在しない（推測）**  
   公式ドキュメントでは `categories` は「アプリ/サイトカテゴリ名のカンマ区切り」と記載されているため、未作成・スペル違い・大文字小文字違いがあると起動が失敗する可能性がある（この点は明示されていないため推測）。

2. **カテゴリ文字列の形式不備**  
   カテゴリはカンマ区切り（例: `social,video`）のみ。スペースや全角記号が混じると無効になる可能性がある。

### 切り分け手順
1. **カテゴリなしで起動できるか確認**  
   ターミナルで以下を実行し、起動するか確認：  
   `open "raycast://focus/start?goal=Test&duration=60&mode=block"`

2. **単一カテゴリで起動確認**  
   事前にRaycast Focusでカテゴリを作成し、同名でテスト：  
   `open "raycast://focus/start?goal=Test&duration=60&categories=social&mode=block"`

3. **複数カテゴリの形式確認**  
   `categories=social,video` の形式で確認し、スペースは入れない。

### 拡張機能側の対策メモ
- 保存時に `categories` を正規化（空白除去・空要素削除）する。  
- 未入力の場合は `categories` パラメータ自体を付けない。  
- UIに「カテゴリはRaycastで事前作成が必要」と明記する。
