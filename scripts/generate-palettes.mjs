import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const xml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[char]));

// Keep the order stable: LIGHT#n and DARK#n identify the same role.
const sections = [
  ['Interface', 'colors', [
    ['Outer chrome', 'activityBar.background'], ['Editor background', 'editor.background'],
    ['Editor text', 'editor.foreground'], ['Sidebar background', 'sideBar.background'],
    ['Accent / buttons', 'button.background'], ['Selection', 'editor.selectionBackground'],
    ['Current line', 'editor.lineHighlightBackground'], ['Cursor', 'editorCursor.foreground'],
    ['Error', 'editorError.foreground'], ['Warning', 'editorWarning.foreground'],
    ['Information', 'editorInfo.foreground'], ['Git added', 'gitDecoration.addedResourceForeground'],
    ['Git modified', 'gitDecoration.modifiedResourceForeground'], ['Git deleted', 'gitDecoration.deletedResourceForeground'],
  ]],
  ['Semantic syntax', 'semanticTokenColors', [
    ['Comment', 'comment'], ['Keyword', 'keyword'], ['String', 'string'], ['Number', 'number'],
    ['Function', 'function'], ['Type', 'type'], ['Variable', 'variable'], ['Readonly variable', 'variable.readonly'],
    ['Property', 'property'], ['Type parameter', 'typeParameter'], ['Operator', 'operator'], ['Regular expression', 'regexp'],
  ]],
  ['TextMate syntax overrides', 'tokenColors', [
    ['Quoted string', 'string.quoted'], ['Built-in variable', 'support.variable'],
    ['Delimiter', 'punctuation.section.block.begin'], ['Comma / semicolon', 'punctuation.separator.comma'],
  ]],
];

for (const mode of ['light', 'dark']) {
  const path = `themes/tracer-${mode}-color-theme.json`;
  const theme = JSON.parse(readFileSync(new URL(path, root), 'utf8'));
  const dark = mode === 'dark';
  const bg = theme.colors['editor.background'];
  const fg = dark ? '#F1F5F8' : '#24323A';
  const muted = dark ? '#B1ADA1' : '#52616A';
  const card = dark ? '#24211D' : '#FFFFFF';
  const border = dark ? '#4B443B' : '#D1D7DA';
  let y = 136;
  let id = 0;
  const groups = [];
  for (const [heading, source, roles] of sections) {
    groups.push(`<text x="36" y="${y}" font-size="20" font-weight="700">${heading}</text>`);
    y += 20;
    roles.forEach(([label, key], index) => {
      let value;
      if (source === 'tokenColors') {
        // Last exact matching foreground wins, including later overrides.
        const rules = theme.tokenColors.filter((rule) => {
          const scopes = Array.isArray(rule.scope) ? rule.scope : (rule.scope ?? '').split(',').map((scope) => scope.trim());
          return scopes.includes(key) && rule.settings.foreground;
        });
        value = rules.at(-1)?.settings.foreground;
      } else {
        const entry = theme[source][key];
        value = typeof entry === 'string' ? entry : entry?.foreground;
      }
      if (!/^#[\da-f]{6}([\da-f]{2})?$/i.test(value ?? '')) throw new Error(`Missing color: ${path} ${source}.${key}`);
      const ref = `${mode.toUpperCase()}#${++id}`;
      const x = 36 + (index % 2) * 492;
      const rowY = y + Math.floor(index / 2) * 78;
      groups.push(`<g transform="translate(${x} ${rowY})">
  <title>${xml(`${ref} · ${source}.${key} · ${value}`)}</title>
  <rect width="472" height="66" rx="8" fill="${card}" stroke="${border}"/>
  <rect x="12" y="12" width="42" height="42" rx="5" fill="${value}" stroke="${border}"/>
  <text x="68" y="27" font-size="15" font-weight="700">${xml(label)}</text>
  <text x="68" y="49" fill="${muted}" font-size="13">${ref} · ${value.toUpperCase()}</text>
</g>`);
    });
    y += Math.ceil(roles.length / 2) * 78 + 30;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="${y + 20}" viewBox="0 0 1040 ${y + 20}" role="img" aria-labelledby="title description">
<title id="title">Tracer ${mode === 'light' ? 'Light' : 'Dark'} palette reference</title>
<desc id="description">Current interface and syntax colors generated from ${path}. Each swatch includes its source in a tooltip. Semantic colors and TextMate overrides are listed separately because language highlighting can differ.</desc>
<rect width="1040" height="${y + 20}" fill="${bg}"/>
<g font-family="ui-monospace, Consolas, monospace" fill="${fg}">
<text x="36" y="52" font-size="30" font-weight="700">TRACER ${mode.toUpperCase()}</text>
<text x="36" y="82" fill="${muted}" font-size="14">${path}</text>
<text x="36" y="105" fill="${muted}" font-size="13">Stable color IDs · hover a swatch for its JSON source</text>
${groups.join('\n')}
</g>
</svg>
`;
  const target = new URL(`docs/tracer-${mode}-palette.svg`, root);
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== svg) throw new Error(`Outdated palette: ${target.pathname}`);
  } else writeFileSync(target, svg);
}
