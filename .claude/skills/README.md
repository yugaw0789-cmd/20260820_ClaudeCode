# Project Skills

このディレクトリの Skill は [emilkowalski/skills](https://github.com/emilkowalski/skills) を
ベンダリング（コピー）したものです。`.claude/skills/<name>/SKILL.md` に置くことで、
このリポジトリで動く Claude Code から自動的に読み込まれます。

- 取得元: https://github.com/emilkowalski/skills
- コミット: `d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7`
- ライセンス: MIT（[LICENSE-emilkowalski-skills](./LICENSE-emilkowalski-skills)）

## 収録 Skill

| Skill | 内容 | 自動起動 |
| --- | --- | --- |
| `emil-design-eng` | UI のポリッシュ・コンポーネント設計・アニメーション判断の総合スキル | ✅ |
| `animate` | Web アニメーションをゼロから実装する（カーブ・duration・プロパティの選定込み） | ✅ |
| `animate-expo` | React Native / Expo のアニメーション、ジェスチャー、画面遷移、ハプティクス | ✅ |
| `review-animations` | 既存のアニメーションコードを厳格にレビューする | 明示呼び出しのみ |
| `improve-animations` | コードベース全体のモーションを監査し、優先度付きの改善プランを作る | ✅ |
| `find-animation-opportunities` | モーションを足すと効く箇所を探す（足すべきでない箇所も指摘） | ✅ |
| `animation-vocabulary` | 曖昧な説明から正しいアニメーション用語を引く逆引き辞典 | ✅ |
| `apple-design` | Apple のインターフェース設計・流体的なモーションの原則を Web に翻訳 | ✅ |
| `write-swift` | モダンな Swift（値型・Swift 6 並行性・ジェネリクス・Swift Testing） | ✅ |
| `pick-ui-library` | タスクに合った UI ライブラリを厳選リストから選ぶ | 明示呼び出しのみ |
| `prototype` | UI の複数バリエーションを作り、ピッカーで比較する | 明示呼び出しのみ |
| `ask-sonner` | トーストライブラリ [Sonner](https://sonner.emilkowal.ski) の使い方・トラブルシュート | ✅ |

「明示呼び出しのみ」の Skill は frontmatter に `disable-model-invocation: true` が付いており、
`/review-animations` のようにユーザーが明示的に呼んだときだけ起動します。

## 使い方

Claude Code をこのリポジトリで起動すれば、上記の Skill は自動で認識されます。
`/skill-name` 形式で明示的に呼び出すこともできます。

> Skill はセッション開始時に読み込まれます。追加・更新した直後のセッションには
> 反映されないので、必ず Claude Code を再起動（または新しいセッションを開始）してください。

## 他のリポジトリ / ワークスペースでも使う

`.claude/skills/` はこのリポジトリ限定です。すべてのプロジェクトで使いたい場合は
**ユーザーレベル**（`~/.claude/skills/`）にインストールします。同梱の
[install-skills.sh](../scripts/install-skills.sh) がそれを行います。

### ローカル（macOS / Linux / WSL）

```bash
bash .claude/scripts/install-skills.sh          # ~/.claude/skills へ導入
bash .claude/scripts/install-skills.sh --local  # このリポジトリの内容をそのまま複製
bash .claude/scripts/install-skills.sh --ref main  # 上流の最新を追う
```

チェックアウトが手元になくても、次の 1 行で同じことができます。

```bash
git clone --depth 1 https://github.com/emilkowalski/skills.git /tmp/emil-skills \
  && mkdir -p ~/.claude/skills \
  && cp -R /tmp/emil-skills/skills/. ~/.claude/skills/ \
  && rm -rf /tmp/emil-skills
```

上流公式の `npx skills@latest add emilkowalski/skills` でも同じ場所に入ります
（対話プロンプトが出るので、スクリプト化するなら上の方法を推奨）。

Windows（PowerShell）の場合は `~/.claude/skills` を `$env:USERPROFILE\.claude\skills`
に読み替えて、上流リポジトリの `skills/` 配下をコピーしてください。

### クラウド（Claude Code on the web）

クラウドのコンテナはセッションごとに作り直され、`~/.claude/skills/` は永続しません。
リポジトリを問わず全セッションで有効にするには、**環境（Environment）のセットアップ
スクリプト**に上の 1 行を登録します。環境設定の手順は
[Claude Code on the web のドキュメント](https://code.claude.com/docs/en/claude-code-on-the-web)
を参照してください。

特定のリポジトリだけで使えれば十分な場合は、このディレクトリのように
`.claude/skills/` をコミットしておくのが最も確実です（clone した時点で揃うため、
セットアップスクリプトもネットワークも不要）。

## 更新方法

このリポジトリのベンダリング分を更新する場合:

```bash
git clone --depth 1 https://github.com/emilkowalski/skills.git /tmp/emil-skills
rm -rf .claude/skills/*/
cp -R /tmp/emil-skills/skills/. .claude/skills/
cp /tmp/emil-skills/LICENSE .claude/skills/LICENSE-emilkowalski-skills
rm -rf /tmp/emil-skills
```

更新後は `install-skills.sh` の `REF` に新しいコミットハッシュを反映してください。
