# シンプルタイマー

依存パッケージなしの静的なカウントダウンタイマーサイトです。HTML / CSS / JavaScript の 3 ファイルのみで動きます。

## 使い方

`index.html` をブラウザで開くだけです。ローカルサーバーで確認する場合:

```sh
python3 -m http.server 8000
# http://localhost:8000 を開く
```

## 機能

- 時 / 分 / 秒を指定してカウントダウン
- 1分・3分・5分・10分・25分のプリセットボタン
- スタート / 一時停止 / 再開 / リセット
- 残り時間を示すリング表示、タブのタイトルにも残り時間を表示
- 終了時にビープ音（Web Audio API・音声ファイル不要）とリングの色変化
- キーボード操作: `Space` で開始 / 一時停止、`R` でリセット
- ライト / ダークモード対応

## 構成

| ファイル | 内容 |
| --- | --- |
| `index.html` | 画面のマークアップ |
| `style.css` | スタイル（配色・リング・レスポンシブ） |
| `script.js` | タイマーのロジック |

残り時間は終了時刻（`performance.now()` 基準）から計算しているため、タブを裏に回して更新が間引かれても、戻ったときに正しい残り時間に追いつきます。

## Claude Code のスキル

[`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official)
のプラグインを Claude Code のスキルに変換したものが `.claude/skills/` に入っています。
プラグインの `skills/` に加えて、スラッシュコマンド (`commands/`) とサブエージェント
(`agents/`) も SKILL.md 形式に変換してあるため、`/plugin install` なしで 92 個すべてを
スキルとして呼び出せます。

```sh
python3 tools/plugins_to_skills.py          # 最新の upstream から再生成
python3 tools/plugins_to_skills.py --check  # 生成物を検証
```

変換の仕組み・命名規則・注意点は [`.claude/plugin-skills/README.md`](.claude/plugin-skills/README.md) を参照してください。

## テスト

ローカルサーバーでページを開き、タイマーの開始・一時停止・リセットが正常に動作することを確認してください。
