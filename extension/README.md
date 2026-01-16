# Raycast Focus Auto-Start Chrome Extension

特定のウェブサイト（YouTube、X/Twitter等）にアクセスした際に、自動的にRaycast Focus Sessionの起動を提案するChrome拡張機能です。

## 機能

### 🎯 主要機能
- **自動検知**: 対象サイト（YouTube、X、Facebook等）へのアクセスを自動検知
- **Raycast Focus起動**: `raycast://` URL schemeでRaycast Focusを制御
- **カスタマイズ可能**: ブラックリスト/ホワイトリストで対象サイトを管理
- **統計情報**: Focus Sessionの開始回数を記録・表示
- **クールダウン機能**: 一度スキップしたら一定時間再通知しない

### 📋 デフォルト対象サイト
- youtube.com
- x.com / twitter.com
- facebook.com
- instagram.com
- reddit.com
- netflix.com
- twitch.tv

## インストール方法

### 前提条件
1. **Raycast** v1.89.0以降がインストールされている必要があります
   - ダウンロード: https://www.raycast.com/
   - macOS専用アプリです
   - Raycast Focusは無料機能です

2. **Google Chrome** または **Chromium系ブラウザ**

### 拡張機能のインストール

#### 開発者モードでインストール（推奨）

1. このレポジトリをクローン:
   ```bash
   git clone <repository-url>
   cd rayforcus-auto
   ```

2. Chromeで `chrome://extensions/` を開く

3. 右上の「デベロッパーモード」を有効化

4. 「パッケージ化されていない拡張機能を読み込む」をクリック

5. `extension` ディレクトリを選択

6. 拡張機能が読み込まれます！

### アイコン画像について

**重要**: 現在、アイコン画像ファイルは含まれていません。以下のサイズのPNG画像を `extension/icons/` ディレクトリに配置してください：

- `icon16.png` (16x16px)
- `icon32.png` (32x32px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

アイコンがない場合でも拡張機能は動作しますが、デフォルトのChromeアイコンが表示されます。

推奨アイコンデザイン:
- 🎯 ターゲットマーク
- ⏱️ タイマー
- 🔔 通知アイコン

オンラインツールで作成可能:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

## 使用方法

### 基本的な使い方

1. 対象サイト（例: YouTube）にアクセス
2. 自動的に確認ダイアログが表示される
3. 以下のいずれかを選択:
   - **Focus 開始**: デフォルト時間でRaycast Focus Sessionを開始
   - **スキップ**: 今回は起動せず、クールダウンを開始
   - **このサイトを除外**: ブラックリストから削除
4. **Raycastの確認ダイアログが表示されます** - 「実行する」を選択してください

### ⚠️ 重要な注意事項

**Raycastのセキュリティ機能により、Deeplink経由でコマンドを実行する際は必ず確認ダイアログが表示されます。**

- これはRaycastの仕様であり、回避できません
- 毎回「実行する」をクリックする必要があります
- セキュリティのための重要な機能です

### 設定画面

拡張機能アイコンをクリック → 「設定を開く」

#### 基本設定
- **デフォルトセッション時間**: 5分〜60分（推奨: 25分）
- **クールダウン時間**: スキップ後の再通知間隔（推奨: 30分）
- **確認ダイアログの遅延**: サイトアクセス後の表示タイミング

#### ブラックリスト管理
- Raycast Focus起動対象のサイトリスト
- 追加/削除が可能
- 例: `youtube.com`, `reddit.com`

#### ホワイトリスト管理
- 特定のURL/パスを除外するパターン
- ワイルドカード `*` 使用可能
- 例: `youtube.com/channel/*` （特定チャンネルは除外）

#### 統計情報
- 総セッション数
- サイト別セッション数

### ポップアップUI

拡張機能アイコンをクリックすると、以下の操作が可能:
- **自動起動の有効/無効切り替え**
- **今すぐFocus開始**: 手動でRaycast Focus Sessionを開始
- **クールダウンをリセット**: 全サイトのクールダウンをクリア

## URL Scheme

Raycast Focusは以下のURL Schemeをサポート:

- `raycast://focus/start?goal=<goal>&duration=<seconds>&mode=block` - Focus Session開始
- `raycast://focus/toggle?goal=<goal>&duration=<seconds>` - セッショントグル
- `raycast://focus/complete` - セッション完了

### パラメータ

| パラメータ | 説明 | 例 |
|----------|------|---|
| `goal` | セッションの目標（オプション） | `Deep%20Work` |
| `duration` | 秒単位の期間（オプション） | `1500` (25分) |
| `mode` | `block` または `allow` | `block` |
| `categories` | カテゴリ名（カンマ区切り） | `social,gaming` |

詳細は [docs/research.md](../docs/research.md) を参照してください。

## トラブルシューティング

### Raycast Focus Sessionが起動しない

1. **Raycastがインストールされているか確認**
   - https://www.raycast.com/ からダウンロード
   - バージョンが v1.89.0以降であることを確認

2. **Raycast Focusが利用可能か確認**
   - Raycastを開いて `⌘ + Space`
   - "Start Focus Session" と入力して表示されるか確認

3. **URL Schemeが正しく動作するか確認**
   - ターミナルで以下を実行:
   ```bash
   open "raycast://focus/start?goal=Test&duration=60"
   ```
   - Raycastの確認ダイアログが表示されればOK

4. **拡張機能の権限を確認**
   - `chrome://extensions/` で権限が正しく設定されているか確認

### ダイアログが表示されない

1. **拡張機能が有効になっているか確認**
   - ポップアップUIで「自動起動」がオンになっているか確認

2. **ブラックリストに対象サイトが含まれているか確認**
   - 設定画面でブラックリストを確認

3. **クールダウン中ではないか確認**
   - ポップアップUIで「クールダウンをリセット」を試す

4. **コンソールでエラーを確認**
   - `F12` で開発者ツールを開き、Console タブでエラーを確認

### パーミッションエラー

拡張機能の再読み込みを試してください:
1. `chrome://extensions/` を開く
2. 拡張機能の「再読み込み」ボタンをクリック

## 開発

### ファイル構成

```
extension/
├── manifest.json       # 拡張機能のマニフェスト
├── background.js       # Service Worker（メインロジック）
├── popup.html          # ポップアップUI
├── popup.js            # ポップアップのスクリプト
├── options.html        # 設定画面UI
├── options.js          # 設定画面のスクリプト
├── icons/              # アイコン画像（要作成）
└── README.md           # このファイル
```

### デバッグ

1. **Background Service Worker のログ**
   - `chrome://extensions/` → 「Service Worker」をクリック
   - Console タブでログを確認

2. **ポップアップのデバッグ**
   - 拡張機能アイコンを右クリック → 「ポップアップを検証」

3. **設定画面のデバッグ**
   - 設定画面を開いた状態で `F12` を押す

## ライセンス

MIT License - 詳細は `LICENSE` ファイルを参照

## クレジット

- [Raycast](https://www.raycast.com/) - macOS用ランチャー・生産性ツール
- [Raycast Script Commands](https://github.com/raycast/script-commands)

## 参考リンク

- [Raycast Focus 公式ページ](https://www.raycast.com/core-features/focus)
- [Raycast Focus マニュアル](https://manual.raycast.com/focus)
- [Raycast Deeplinks ドキュメント](https://manual.raycast.com/deeplinks)
- [詳細なリサーチ結果](../docs/research.md)

## 貢献

Issue や Pull Request を歓迎します！

## 今後の予定

- [ ] Safari拡張版の提供
- [ ] サイト別の時間設定
- [ ] Focus Categoriesとの連携
- [ ] 時間帯による自動有効化
- [ ] 統計のエクスポート機能
