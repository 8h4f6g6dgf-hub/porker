# GitHub Pages / Sites の両対応

GitHub側の既存 `.github/workflows/deploy-pages.yml` を維持しています。`main`へのpushまたは手動実行でテスト・ビルドし、GitHub Pagesへデプロイします。

- GitHub Pages: `GITHUB_PAGES=true npm run build` → アセットのbaseは `/porker/`。HashRouterで `/porker/#/academy` などに遷移するため、ページ再読み込みでも404になりません。
- Sites／通常のローカル開発: `npm run build` → baseは `/`、既存のBrowserRouterとURLを維持します。
- 別のサブパス: `VITE_BASE_PATH=/example/ npm run build` で明示できます。

対象URL: https://8h4f6g6dgf-hub.github.io/porker/

公開の成否はGitHub ActionsとPages設定に依存します。この設定ファイルの追加だけで新バージョンの公開完了とはみなしません。

学習履歴はオリジンごとのlocalStorageです。SitesとGitHub Pagesの履歴は自動同期されません。既存の保存キーや履歴スキーマは変更していません。
