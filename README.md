# Raycast Focus Auto-Start

特定のウェブサイトにアクセスした際に、自動的にRaycast Focus Sessionの起動を提案するChrome拡張機能です。

## 📝 概要

このプロジェクトは以下の2つの要素で構成されています：

1. **Raycast Script Commands** - raycast/script-commandsリポジトリのクローン（参考用）
2. **Chrome拡張機能** - 特定サイトへのアクセスを検知し、Raycast Focus Sessionの起動を提案

## 🎯 目的

集中力を削ぐ可能性のあるサイト（YouTube、SNS等）にアクセスした際に、自動的にRaycast Focus Sessionを開始することで生産性を維持します。

## 📂 プロジェクト構成

```
rayforcus-auto/
├── commands/              # Raycast Script Commands（クローン）
│   ├── apps/focus/       # heyfocus.comアプリ用（参考）
│   └── ...
├── extension/            # Chrome拡張機能（メイン）
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html/js
│   ├── options.html/js
│   └── icons/           # アイコン画像（要作成）
├── docs/                # ドキュメント
│   ├── requirements.md  # 詳細な要件定義
│   └── research.md      # Raycast Focus調査結果
└── README.md           # このファイル
```

## 🚀 クイックスタート

### 前提条件

1. **Raycast** v1.89.0以降をインストール
   - ダウンロード: https://www.raycast.com/
   - macOS専用アプリ
   - Raycast Focusは無料機能

2. **Google Chrome**または**Chromium系ブラウザ**

### インストール

1. レポジトリをクローン:
   ```bash
   git clone <repository-url>
   cd rayforcus-auto
   ```

2. Chrome拡張機能をインストール:
   - Chromeで `chrome://extensions/` を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `extension` ディレクトリを選択

3. Raycast Focusが利用可能か確認:
   - Raycastを開く（`⌘ + Space`）
   - "Start Focus Session" と入力して表示されるか確認

## 💡 使い方

### Chrome拡張機能

1. YouTube等の対象サイトにアクセス
2. 自動的に確認ダイアログが表示される
3. 「Focus 開始」を選択
4. **Raycastの確認ダイアログが表示される** - 「実行する」を選択
5. Raycast Focus Sessionが開始

### ⚠️ 重要な注意事項

**Raycastのセキュリティ機能により、毎回確認ダイアログが表示されます。**
- これは仕様であり、回避できません
- 「実行する」をクリックしてFocus Sessionを開始してください

詳細は [extension/README.md](extension/README.md) を参照

### Raycast Script Commands について

`commands/` ディレクトリには、raycast/script-commandsリポジトリからクローンしたスクリプトが含まれています。

**注意**: `commands/apps/focus/` 内のスクリプトは **heyfocus.com の Focusアプリ用**であり、Raycast Focusとは別のアプリです。参考資料として含まれていますが、本プロジェクトでは使用しません。

Raycast Focusは、URL Scheme（`raycast://focus/start`）を通じて直接制御します。

## 📖 ドキュメント

- [リサーチ結果](docs/research.md) - Raycast Focusの詳細調査
- [要件定義書](docs/requirements.md) - 詳細な機能要件と技術仕様（初期版・heyfocus.com用）
- [拡張機能 README](extension/README.md) - Chrome拡張機能の詳細ドキュメント

## 🔧 開発

### Chrome拡張機能の開発

```bash
# 拡張機能ディレクトリに移動
cd extension

# 変更後、chrome://extensions/ で「再読み込み」をクリック
```

### デバッグ

- **Background Service Worker**: `chrome://extensions/` → 「Service Worker」をクリック
- **ポップアップ**: 拡張機能アイコンを右クリック → 「ポップアップを検証」
- **設定画面**: 設定画面を開いた状態で `F12`

## 🎨 アイコン画像について

**重要**: 拡張機能のアイコン画像は含まれていません。

以下のサイズのPNG画像を `extension/icons/` に配置してください：
- icon16.png (16x16px)
- icon32.png (32x32px)
- icon48.png (48x48px)
- icon128.png (128x128px)

推奨ツール:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

## 📄 ライセンス

MIT License

## 🙏 クレジット

- [Raycast](https://www.raycast.com/) - macOS用ランチャー・生産性ツール
- [Raycast Script Commands](https://github.com/raycast/script-commands) - MIT License

## 参考リンク

- [Raycast Focus 公式ページ](https://www.raycast.com/core-features/focus)
- [Raycast Focus マニュアル](https://manual.raycast.com/focus)
- [Raycast Deeplinks ドキュメント](https://manual.raycast.com/deeplinks)

## 🤝 貢献

Issue や Pull Request を歓迎します！

## 📋 TODO

- [ ] アイコン画像の作成
- [ ] Chrome Web Storeへの公開
- [ ] Safari拡張版の開発
- [ ] Focus Categoriesとの連携強化
- [ ] テストの追加
- [ ] CI/CD の設定
