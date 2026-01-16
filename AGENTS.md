# Repository Guidelines

## Project Structure & Module Organization

- `extension/`: Chrome拡張機能の本体（`background.js`, `popup.*`, `options.*`, `manifest.json`）。ここが主な開発対象。
- `commands/`: Raycast Script Commands のクローン（参考用）。原則編集対象外。
- `docs/`: 要件や調査メモ（`requirements.md`, `research.md`）。
- `Tools/Toolkit/`: ドキュメント自動生成用のSwift CLI。`Tools/Toolkit/Tests/` にテストあり。
- `images/`: README用のスクリーンショット等。

## Build, Test, and Development Commands

- `cd extension` + `chrome://extensions/` で「パッケージ化されていない拡張機能を読み込む」→ `extension/` を選択。
- 変更後は `chrome://extensions/` で再読み込み。
- Toolkitビルド: `make build`（リリース）、`make build-debug`（デバッグ）。
- Toolkitドキュメント生成: `make gen-docs` / `make gen-docs-and-commit`。
- SwiftLint: `make lint` / `make fix`（`swiftlint` が必要）。

## Coding Style & Naming Conventions

- `commands/` 配下は小文字のダッシュケースで統一（例: `spotify-next-track.applescript`）。
- 変更が必要なスクリプトは `.template.` を含める（例: `github-notifications.template.sh`）。
- RaycastコマンドのメタデータはTitle Case、`packageName` を必ず指定。
- 英語表記は米国英語に統一。
- Script Commands は非ログインシェル前提（`#!/bin/bash -l` は不可）。

## Testing Guidelines

- Toolkit: `swift test --package-path Tools/Toolkit`（`ToolkitLibraryTests`）。
- 拡張機能は自動テストなし。主要フローは手動で確認。

## Commit & Pull Request Guidelines

- 直近のコミットは短い命令形（例: "Implement …"）。同様の簡潔な形式を推奨。
- PRは焦点を絞り、テンプレートがある場合は必ず記入。
- 1つのPRに複数の大きなScript Commandをまとめない。

## Security & Configuration Tips

- APIキーなどの機密情報はコミットしない。必要なら `.template.` 化して説明コメントを追記。
- 自動生成ファイル `commands/README.md` と `commands/extensions.json` は編集しない（上書きされます）。
