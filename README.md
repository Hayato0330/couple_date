# Couple Date AI

カップルのMBTIから、デート・一緒に楽しめることをAIが提案するアプリ。Cloudflare Pages + Pages Functions + D1 + Google Gemini API で構成。

## 仕組み

- フロント: `index.html`（単一ページ、ビルド不要）
- API: `functions/api/*.js`（Cloudflare Pages Functions）
- DB: Cloudflare D1（カップル情報・提案履歴・評価フィードバックを保存）
- AI: Google Gemini API（無料枠あり）で提案文を生成
- 学習: 自分たちの過去の評価（良かった/悪かった）と、**同じMBTIの組み合わせの他カップルの実績**（高評価だった提案）をプロンプトに含めることで提案の精度を上げる

## セットアップ手順

### 1. Gemini APIキーを取得
1. https://aistudio.google.com/apikey にアクセス
2. 無料でAPIキーを発行（Gemini 2.0 Flashは無料枠あり、レート制限あり）

### 2. D1データベースを作成
```
npx wrangler d1 create couple_date_db
```
出力された `database_id` を `wrangler.toml` の `REPLACE_WITH_YOUR_D1_DATABASE_ID` に貼り付ける。

スキーマを適用:
```
npx wrangler d1 execute couple_date_db --file=./schema.sql --remote
```

### 3. Cloudflare Pages プロジェクトに環境変数(シークレット)を設定
Cloudflare ダッシュボード → Pages プロジェクト → Settings → Environment variables で以下を追加（Production/Preview両方）:
- `GEMINI_API_KEY`: 取得したGemini APIキー
- `SESSION_SECRET`: 適当なランダム文字列（ログイントークンの署名用）

または wrangler CLI から:
```
npx wrangler pages secret put GEMINI_API_KEY
npx wrangler pages secret put SESSION_SECRET
```

### 4. D1バインディングをPagesプロジェクトにも設定
Cloudflare ダッシュボード → Pages プロジェクト → Settings → Functions → D1 database bindings で
`DB` という名前で `couple_date_db` をバインドする。

### 5. デプロイ
GitHubリポジトリと連携済みならpushするだけで自動デプロイされる。

## 使い方
1. 2人の名前とMBTIタイプを入力して登録すると、招待コード（6文字）が発行される
2. 次回からは招待コード + PINでログイン
3. 気分・予算・エリアなどを入力して「AIに提案してもらう」
4. 提案ごとに★評価・実行したかを記録すると、次回以降の提案精度が上がる

## 今後の拡張（未実装）
- Googleカレンダー等との連携による空き時間ベースの提案調整（OAuth連携が必要なため次フェーズ）
- 他カップルの実績データは現状「自分のD1内に蓄積された全カップルの匿名集計」を使用。将来的に複数デプロイ間でデータ共有する場合は別途データ基盤が必要
