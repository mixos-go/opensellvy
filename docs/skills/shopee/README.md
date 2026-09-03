# shopee — Shopee Open Platform API skill

Skill mandiri ala pola `@tts-open-toolkit`/`tts-openapi-*` dari TikTok Shop, tapi
untuk Shopee Open Platform. Struktur identik dengan skill toolkit:

```
shopee/
├── SKILL.md          # name + description, workflow, output shape, references
├── agents/
│   └── openai.yaml   # interface config (display_name, short_description, default_prompt)
└── references/
    └── api/          # 29 kategori, 444 API doc (clean Markdown)
        ├── AMS/
        ├── Product/
        ├── Logistics/
        ├── Order/
        └── ...
```

## Cara pakai (untuk agent/LLM)

Salin ke direktori skills coding-agent (mis. `.codex/skills/` atau
`.claude/skills/`), atau set langsung sebagai skill. Saat ada pertanyaan API
Shopee, skill `shopee-openapi-guide` memandu inspect `references/api/**` lalu
cross-check ke dok resmi bila perlu.

## Update / regenerasi

Konten `references/api/` adalah **snapshot statis**. Untuk memperbarui API
Shopee, jalankan toolchain di repo `updskills`
(`tools/bulk_render_shopee.py`) — sumber manifest resmi di
`https://open.shopee.com/opservice/api/v1/doc/module/?version=2`, lalu re-render
ke `references/api/`. Tidak perlu mengedit manual satu-satu.
