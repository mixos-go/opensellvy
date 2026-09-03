import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DOCS_ROOT = join(__dirname, '..', '..', '..', 'docs', 'skills', 'shopee', 'references', 'api');
const OUT_DIR = join(__dirname, '..', 'src', 'generated');

interface Param {
  name: string;
  type: string;
  required: boolean;
}

interface ParsedDoc {
  category: string;
  apiName: string;
  method: string;
  path: string;
  request: Param[];
  response: Param[];
}

// ---------------------------------------------------------------------------
// Parsing doc
// ---------------------------------------------------------------------------
function parseFrontmatter(md: string): { category: string; apiName: string } {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  const category = match?.[1].match(/^category:\s*(.+)$/m)?.[1]?.trim() ?? '';
  const apiName = match?.[1].match(/^api_name:\s*(.+)$/m)?.[1]?.trim() ?? '';
  return { category, apiName };
}

function parseTable(md: string, heading: string): Param[] {
  const idx = md.indexOf(heading);
  if (idx === -1) return [];
  const rest = md.slice(idx + heading.length);
  const endMatch = rest.match(/\n## /);
  const section = endMatch ? rest.slice(0, endMatch.index) : rest;
  const lines = section.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return [];
  const rows = lines.slice(2);
  const params: Param[] = [];
  for (const line of rows) {
    const cells = line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    const name = cells[0]!;
    const type = cells[1]!;
    const required = heading.includes('Request') ? cells[2]?.toLowerCase() === 'true' : false;
    if (!name || name === 'Name') continue;
    params.push({ name, type, required });
  }
  return params;
}

function parseDoc(file: string): ParsedDoc {
  const md = readFileSync(file, 'utf8');
  const { category, apiName } = parseFrontmatter(md);
  const method = md.match(/\*\*Method:\*\*\s*(\w+)/)?.[1] ?? 'GET';
  const path = md.match(/\*\*HTTP Path:\*\*\s*([^\n]+)/)?.[1]?.trim() ?? '';
  const request = parseTable(md, '## Request Parameters');
  const response = parseTable(md, '## Response Parameters');
  return { category, apiName, method, path, request, response };
}

function collectDocs(): ParsedDoc[] {
  const docs: ParsedDoc[] = [];
  const categories = readdirSync(DOCS_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const cat of categories) {
    const dir = join(DOCS_ROOT, cat.name);
    const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
    for (const f of files) {
      docs.push(parseDoc(join(dir, f)));
    }
  }
  return docs;
}

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------
function arrayDepth(t: string): number {
  let depth = 0;
  let s = t.trim();
  while (s.endsWith('[]')) {
    depth++;
    s = s.slice(0, -2).trim();
  }
  return depth;
}

function baseToken(t: string): string {
  let s = t.trim();
  while (s.endsWith('[]')) s = s.slice(0, -2).trim();
  return s.toLowerCase();
}

function isObjectType(t: string): boolean {
  return baseToken(t) === 'object';
}

function tsPrimitive(raw: string): string {
  const t = baseToken(raw);
  if (t === 'object') return 'Record<string, unknown>';
  switch (t) {
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'int':
    case 'int32':
    case 'int64':
    case 'long':
    case 'number':
    case 'float':
    case 'double':
    case 'decimal':
      return 'number';
    case 'timestamp':
      return 'number';
    case 'any':
      return 'unknown';
    default:
      return 'string';
  }
}

function tsType(raw: string): string {
  const depth = arrayDepth(raw);
  const prim = tsPrimitive(raw);
  return prim + '[]'.repeat(depth);
}

function sanitizeTypeName(name: string): string {
  return (name.charAt(0).toUpperCase() + name.slice(1)).replace(/[^A-Za-z0-9_]/g, '');
}

function methodName(apiName: string): string {
  return apiName
    .split('_')
    .map((s, i) => (i === 0 ? s || 'x' : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('')
    .replace(/[^A-Za-z0-9]/g, '');
}

function isPublicApi(d: ParsedDoc): boolean {
  const n = d.apiName;
  return (
    d.path.includes('/public/') ||
    n === 'get_product_code_policy' ||
    /^(get_access_token|refresh_access_token|get_shops_by_partner|get_merchants_by_partner|get_token_by_resend_code|get_shopee_ip_ranges)$/.test(n)
  );
}

function categoryAccessor(cat: string): string {
  return cat.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

function className(cat: string): string {
  return 'ShopeeApi' + sanitizeTypeName(cat);
}

function propName(name: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

// ---------------------------------------------------------------------------
// Nested response builder (object-boundary rule)
// ---------------------------------------------------------------------------
interface Node {
  name: string;
  type: string; // type token original (mungkin "object[]")
  required: boolean;
  children: Node[];
  ifaceName?: string; // nama interface sub bila object punya anak (di-set buildSubs)
}

function buildTree(list: Param[]): Node[] {
  const walk = (rows: Param[]): Node[] => {
    const out: Node[] = [];
    let i = 0;
    while (i < rows.length) {
      const p = rows[i]!;
      if (isObjectType(p.type)) {
        const childRows: Param[] = [];
        let j = i + 1;
        while (j < rows.length && !isObjectType(rows[j]!.type)) {
          childRows.push(rows[j]!);
          j++;
        }
        out.push({ name: p.name, type: p.type, required: p.required, children: walk(childRows) });
        i = j;
      } else {
        out.push({ name: p.name, type: p.type, required: p.required, children: [] });
        i++;
      }
    }
    return out;
  };
  return walk(list);
}

interface SubIface {
  name: string;
  fields: Node[];
}

function sameNodes(a: Node[], b: Node[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.name !== b[i]!.name || a[i]!.type !== b[i]!.type || a[i]!.required !== b[i]!.required) return false;
    if (!sameNodes(a[i]!.children, b[i]!.children)) return false;
  }
  return true;
}

// Render fields → baris deklarasi; object dgn anak dirender sbg sub-interface
// dgn nama stabil. Mengembalikan array interface yang perlu dideklarasikan.
// Asumsi: deps.subs sudah berisi semua sub-interface utk file ini (dibangun
// oleh buildSubs). Nama sub di-set ke f.type bila f.type === 'object'.
function renderFields(fields: Node[], deps: { subs: SubIface[] }): { lines: string[] } {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const f of fields) {
    if (seen.has(f.name)) continue; // duplikat nama di scope sama → buang (boundary rule vs doc flat)
    seen.add(f.name);
    const sub = f.ifaceName ? deps.subs.find((s) => s.name === f.ifaceName) : undefined;
    if (sub) {
      const dims = '[]'.repeat(arrayDepth(f.type));
      lines.push(`  ${propName(f.name)}${f.required ? '' : '?'}: ${sub.name}${dims};`);
    } else if (isObjectType(f.type) && f.children.length === 0) {
      const dims = '[]'.repeat(arrayDepth(f.type));
      lines.push(`  ${propName(f.name)}${f.required ? '' : '?'}: Record<string, unknown>${dims};`);
    } else {
      lines.push(`  ${propName(f.name)}${f.required ? '' : '?'}: ${tsType(f.type)};`);
    }
  }
  return { lines };
}

// ---------------------------------------------------------------------------
// Emitter per kategori
// ---------------------------------------------------------------------------
function emitCategoryFile(cat: string, docs: ParsedDoc[]): string {
  const lines: string[] = [];
  lines.push(`/* AUTOGENERATED — DO NOT EDIT. Run: pnpm --filter @opensellvy/platform-shopee generate */`);
  lines.push(`/* Kategori: ${cat} — ${docs.length} API */`);
  lines.push(`import type { ShopeeClient } from '../shopee.client';`);
  lines.push(`import type { ShopeeApiType, ShopeeApiOptions } from './_shared';`);
  lines.push(``);

  const doc = [...docs].sort((a, b) => a.apiName.localeCompare(b.apiName));

  // Request interfaces (flat)
  for (const d of doc) {
    const seen = new Set<string>();
    const fields: string[] = [];
    for (const p of d.request) {
      if (['partner_id', 'timestamp', 'access_token', 'shop_id', 'sign'].includes(p.name)) continue;
      if (seen.has(p.name)) continue;
      seen.add(p.name);
      fields.push(`  ${propName(p.name)}${p.required ? '' : '?'}: ${tsType(p.type)};`);
    }
    lines.push(`export interface Req_${d.apiName} {`);
    lines.push(fields.length ? fields.join('\n') : `  [key: string]: unknown;`);
    lines.push(`}`);
    lines.push(``);
  }

  // Respon nested per API — kumpulkan sub-interface unik (berisi konten) utk seluruh file
  const fileSubs: { name: string; fields: Node[] }[] = [];
  const apiRoots: { name: string; root: Node[] }[] = [];
  for (const d of doc) {
    const tree = buildTree(d.response);
    const top = ['request_id', 'error', 'message', 'response'];
    const nonTop = tree.filter((f) => !top.includes(f.name));
    const resp = tree.find((f) => f.name === 'response');
    const root = resp && resp.children.length > 0 ? resp.children : nonTop;
    apiRoots.push({ name: `Res_${d.apiName}`, root });
  }
  // bangun semua sub-interfaces dgn reuse antar API (konten sama → nama sama)
  const buildSubs = (fields: Node[], deps: { subs: { name: string; fields: Node[] }[] }): void => {
    for (const f of fields) {
      if (isObjectType(f.type) && f.children.length > 0) {
        let sub = deps.subs.find((s) => sameNodes(s.fields, f.children));
        let name: string;
        if (sub) {
          name = sub.name;
        } else {
          name = `Nested${deps.subs.length}`;
          deps.subs.push({ name, fields: f.children });
          buildSubs(f.children, deps);
        }
        f.ifaceName = name; // jangan timpa f.type (butuh dims array)
      }
    }
  };
  for (const { root } of apiRoots) buildSubs(root, { subs: fileSubs });
  // emit sub-interfaces dulu (anak sebelum orangtua — sudah urut buildSubs)
  for (const s of fileSubs) {
    lines.push(`export interface ${s.name} {`);
    const r = renderFields(s.fields, { subs: fileSubs });
    lines.push(r.lines.length ? r.lines.join('\n') : `  [key: string]: unknown;`);
    lines.push(`}`);
    lines.push(``);
  }
  // emit Res_ (root) — sub type sudah di-set ke nama interface
  for (const { name, root } of apiRoots) {
    const r = renderFields(root, { subs: fileSubs });
    lines.push(`export interface ${name} {`);
    lines.push(r.lines.length ? r.lines.join('\n') : `  [key: string]: unknown;`);
    lines.push(`}`);
    lines.push(``);
  }

  // Class
  const cls = className(cat);
  lines.push(`export class ${cls} {`);
  lines.push(`  constructor(private readonly client: ShopeeClient, private readonly opts: ShopeeApiOptions = {}) {}`);
  lines.push(``);
  for (const d of doc) {
    const mn = methodName(d.apiName);
    const reqType = `Req_${d.apiName}`;
    const resType = `Res_${d.apiName}`;
    const isPublic = isPublicApi(d);
    lines.push(`  ${mn}(req?: ${reqType}): Promise<${resType}> {`);
    lines.push(`    const apiType: ShopeeApiType = ${isPublic ? `'public'` : `'shop'`};`);
    lines.push(`    const options: { accessToken?: string; shopId?: string; apiType: ShopeeApiType } = { apiType };`);
    lines.push(`    if (this.opts.accessToken !== undefined) options.accessToken = this.opts.accessToken;`);
    lines.push(`    if (this.opts.shopId !== undefined) options.shopId = this.opts.shopId;`);
    lines.push(`    const reqParams = (req ?? {}) as Record<string, unknown>;`);
    lines.push(`    return this.client.request<${resType}>(`);
    lines.push(`      { apiType, path: ${JSON.stringify(d.path)}, method: ${JSON.stringify(d.method)} as 'GET' | 'POST', params: reqParams },`);
    lines.push(`      options,`);
    lines.push(`    );`);
    lines.push(`  }`);
    lines.push(``);
  }
  lines.push(`}`);
  lines.push(``);
  return lines.join('\n');
}

function main() {
  const docs = collectDocs();
  if (docs.length === 0) throw new Error(`Tidak ada doc ditemukan di ${DOCS_ROOT}`);
  mkdirSync(OUT_DIR, { recursive: true });

  const byCat = new Map<string, ParsedDoc[]>();
  for (const d of docs) {
    if (!byCat.has(d.category)) byCat.set(d.category, []);
    byCat.get(d.category)!.push(d);
  }

  // _shared.ts
  const shared = [
    `/* AUTOGENERATED — DO NOT EDIT. Run: pnpm --filter @opensellvy/platform-shopee generate */`,
    `/* Shared types untuk generated client. */`,
    `export type ShopeeApiType = 'public' | 'shop';`,
    ``,
    `export interface ShopeeApiOptions {`,
    `  /** default access token utk shop api — bisa di-override per call. */`,
    `  accessToken?: string;`,
    `  shopId?: string;`,
    `}`,
    ``,
    `/** Wrapper response Shopee: error kosong = sukses, response berisi data. */`,
    `export interface ShopeeResp<T = unknown> {`,
    `  request_id?: string;`,
    `  error: string;`,
    `  message?: string;`,
    `  detail?: unknown;`,
    `  response?: T;`,
    `}`,
    ``,
  ].join('\n');

  // per kategori
  const importLines: string[] = [];
  const exportLines: string[] = [];
  const factoryEntries: string[] = [];
  const interfaceEntries: string[] = [];
  for (const [cat, docsInCat] of byCat) {
    const acc = categoryAccessor(cat);
    const cls = className(cat);
    const file = `${acc}.ts`;
    writeFileSync(join(OUT_DIR, file), emitCategoryFile(cat, docsInCat), 'utf8');
    importLines.push(`import { ${cls} } from './${acc}';`);
    exportLines.push(`export { ${cls} } from './${acc}';`);
    factoryEntries.push(`  ${acc}: new ${cls}(client, opts),`);
    interfaceEntries.push(`  ${acc}: ${cls};`);
  }

  // index.ts — factory
  const index = [
    `/* AUTOGENERATED — DO NOT EDIT. Run: pnpm --filter @opensellvy/platform-shopee generate */`,
    `import type { ShopeeClient } from '../shopee.client';`,
    `import type { ShopeeApiOptions } from './_shared';`,
    ...importLines,
    ...exportLines,
    ``,
    `export type { ShopeeApiType, ShopeeApiOptions, ShopeeResp } from './_shared';`,
    `export * from './_shared';`,
    ``,
    `export interface ShopeeApi {`,
    ...interfaceEntries,
    `}`,
    ``,
    `/** Bangun facade lengkap Shopee API (${byCat.size} kategori). */`,
    `export function createShopeeApi(client: ShopeeClient, opts: ShopeeApiOptions = {}): ShopeeApi {`,
    `  return {`,
    ...factoryEntries.map((e) => e.replace('  ', '    ')),
    `  };`,
    `}`,
    ``,
  ].join('\n');
  writeFileSync(join(OUT_DIR, 'index.ts'), index, 'utf8');
  writeFileSync(join(OUT_DIR, '_shared.ts'), shared, 'utf8');

  const acc = (s: string) => categoryAccessor(s);
  console.log(`Generated ${docs.length} APIs → ${OUT_DIR}`);
  console.log(`Categories: ${byCat.size} (${[...byCat.keys()].map(acc).join(', ')})`);
}

main();
