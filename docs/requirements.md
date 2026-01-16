# Raycast Focus Auto-Start Chrome Extension

## 概要
特定のウェブサイト（YouTube、X/Twitter等）にアクセスした際に、自動的にFocus Session（macOS Focusアプリ）の起動を提案するChrome拡張機能。

## 目的
集中力を削ぐ可能性のあるサイトにアクセスした際に、Focus Sessionを開始することで生産性を維持する。

## 主要機能

### 1. サイト検知機能
- **対象サイトの検知**: 特定のウェブサイトへのアクセスをリアルタイムで検知
- **デフォルト対象サイト**:
  - youtube.com
  - x.com / twitter.com
  - facebook.com
  - instagram.com
  - reddit.com
  - netflix.com
  - twitch.tv

### 2. Focus Session起動機能
- **URL Schemeを使用**: focus:// URL schemeでFocusアプリを制御
- **起動オプション**:
  - デフォルト: 25分のフォーカスセッション (focus://focus?minutes=25)
  - カスタム時間設定: ユーザーが指定した時間でセッション開始
  - 時間制限なし: focus://focus

### 3. ユーザー確認UI
- **確認方法**: 対象サイトにアクセス時に選択肢を表示
  - オプション1: ブラウザのネイティブ確認ダイアログ
  - オプション2: カスタム通知UI（非侵襲的）
- **選択肢**:
  - Focus Sessionを開始する（デフォルト時間）
  - カスタム時間でFocus Sessionを開始
  - 今回はスキップ
  - このサイトを除外リストに追加

### 4. 設定管理機能
- **ブラックリスト管理**: Focus Session起動対象のサイトリスト
  - デフォルトリストを提供
  - ユーザーが追加/削除可能
  - URL パターンマッチング（ワイルドカード対応）

- **ホワイトリスト管理**: 特定のURL/パスを除外
  - 例: youtube.com/channel/[educational-channel] は除外

- **動作設定**:
  - 自動起動の有効/無効切り替え
  - デフォルトのセッション時間（5分、15分、25分、45分、60分、カスタム）
  - 確認ダイアログの表示方法（即座/3秒遅延/5秒遅延）
  - 同一セッション中の重複通知を防止

### 5. セッション管理
- **重複防止**: すでにFocus Sessionが実行中の場合は通知しない
- **クールダウン**: 一度スキップしたら、一定時間（例: 30分）は同じサイトで再通知しない
- **セッション履歴**: どのサイトでどれだけFocus Sessionを開始したか記録（統計表示）

## 技術仕様

### Chrome Extension Manifest V3
- **必要なPermissions**:
  - tabs: タブ情報の取得とURL監視
  - storage: 設定とブラックリスト/ホワイトリストの保存
  - notifications: （オプション）通知の表示
  - alarms: （オプション）クールダウンタイマー管理

### コンポーネント構成

#### 1. manifest.json
- Manifest V3形式
- 必要な権限とリソースを定義

#### 2. background.js (Service Worker)
- タブのURL変更を監視
- ブラックリスト/ホワイトリストとマッチング
- Focus アプリの起動制御
- クールダウン管理

#### 3. options.html / options.js
- 設定画面UI
- ブラックリスト/ホワイトリストの管理
- デフォルトセッション時間の設定
- 統計情報の表示

#### 4. popup.html / popup.js（オプション）
- 拡張機能アイコンクリック時の簡易UI
- クイック設定変更
- 現在のステータス表示

### URL Scheme制御

Focusアプリは以下のURL Schemeをサポート:
- focus://focus - 時間制限なしセッション開始
- focus://focus?minutes=25 - 25分セッション開始
- focus://focus?hours=1&minutes=30 - 1時間30分セッション開始
- focus://unfocus - セッション停止
- focus://toggle - セッショントグル
- focus://break?minutes=5 - 5分休憩
- focus://preferences - 設定を開く

## ユーザーフロー

### 1. 初回インストール時
1. Chrome Web Storeから拡張機能をインストール
2. Focusアプリ (https://heyfocus.com) がインストールされているか確認
3. デフォルト設定で有効化
4. オプション画面でカスタマイズ可能

### 2. サイトアクセス時
1. ユーザーが対象サイト（例: youtube.com）にアクセス
2. 拡張機能がURL変更を検知
3. ブラックリストとマッチング確認
4. クールダウン中でないか確認
5. すでにFocus Session実行中でないか確認（オプション）
6. 確認UIを表示
7. ユーザーが選択:
   - Focus開始: focus://focus?minutes=25 を開く
   - カスタム時間: ユーザー入力 → focus://focus?minutes=X
   - スキップ: クールダウンを開始
   - このサイトを除外: ブラックリストから削除

### 3. 設定変更時
1. 拡張機能アイコンをクリック → "Options"
2. 設定画面でブラックリスト/ホワイトリストを編集
3. デフォルトセッション時間を変更
4. 変更を保存 → Chrome Storageに保存

## 非機能要件

### パフォーマンス
- タブURL変更の検知は即座に行う（100ms以内）
- UIの表示は非ブロッキング
- ストレージアクセスは最小限に

### セキュリティ
- ユーザーのブラウジング履歴は保存しない
- 統計データはローカルのみ（外部送信なし）
- Content Security Policyに準拠

### ユーザビリティ
- 初期設定不要で即座に使える
- 設定画面はシンプルで直感的
- 通知は邪魔にならない程度に

### 互換性
- Chrome 最新版（Manifest V3対応）
- macOS専用（Focusアプリ依存）
- Focusアプリ (https://heyfocus.com) が必要

## 将来の拡張案

- Safari拡張版の提供
- 他のフォーカスアプリとの連携（Pomodoro Timer等）
- サイト別の時間設定（YouTubeは25分、Redditは15分など）
- 時間帯による自動有効化（例: 勤務時間のみ）
- 統計のエクスポート機能
- 他のブロッカー拡張との統合

## 参考リンク

- Focus アプリ: https://heyfocus.com
- Chrome Extension Manifest V3: https://developer.chrome.com/docs/extensions/mv3/
- Chrome Storage API: https://developer.chrome.com/docs/extensions/reference/storage/
