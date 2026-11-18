import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

// Zed style property -> VS Code workbench color.
const interfaceColors = {
  background: 'editor.background',
  'surface.background': 'sideBar.background',
  'elevated_surface.background': 'menu.background',
  border: 'panel.border',
  'border.variant': 'sideBarSectionHeader.border',
  'border.focused': 'focusBorder',
  'border.selected': 'activityBar.activeBorder',
  'border.transparent': 'contrastBorder',
  'border.disabled': 'input.border',
  text: 'foreground',
  'text.muted': 'descriptionForeground',
  'text.placeholder': 'input.placeholderForeground',
  'text.disabled': 'disabledForeground',
  'text.accent': 'textLink.foreground',
  icon: 'icon.foreground',
  'icon.muted': 'descriptionForeground',
  'icon.disabled': 'disabledForeground',
  'icon.placeholder': 'input.placeholderForeground',
  'icon.accent': 'activityBar.foreground',
  'element.background': 'button.secondaryBackground',
  'element.hover': 'button.secondaryHoverBackground',
  'element.active': 'inputOption.activeBackground',
  'element.selected': 'list.activeSelectionBackground',
  'ghost_element.background': 'contrastBorder',
  'ghost_element.hover': 'list.hoverBackground',
  'ghost_element.active': 'list.activeSelectionBackground',
  'ghost_element.selected': 'list.activeSelectionBackground',
  'drop_target.background': 'editor.selectionBackground',
  'title_bar.background': 'titleBar.activeBackground',
  'title_bar.inactive_background': 'titleBar.inactiveBackground',
  'status_bar.background': 'statusBar.background',
  'toolbar.background': 'breadcrumb.background',
  'tab_bar.background': 'editorGroupHeader.tabsBackground',
  'tab.active_background': 'tab.activeBackground',
  'tab.inactive_background': 'tab.inactiveBackground',
  'panel.background': 'sideBar.background',
  'panel.focused_border': 'focusBorder',
  'pane.focused_border': 'focusBorder',
  'pane_group.border': 'editorGroup.border',
  'editor.background': 'editor.background',
  'editor.foreground': 'editor.foreground',
  'editor.gutter.background': 'editor.background',
  'editor.subheader.background': 'breadcrumb.background',
  'editor.active_line.background': 'editor.lineHighlightBackground',
  'editor.highlighted_line.background': 'editor.rangeHighlightBackground',
  'editor.line_number': 'editorLineNumber.foreground',
  'editor.active_line_number': 'editorLineNumber.activeForeground',
  'editor.invisible': 'editorWhitespace.foreground',
  'editor.wrap_guide': 'editorRuler.foreground',
  'editor.active_wrap_guide': 'editorIndentGuide.activeBackground1',
  'editor.indent_guide': 'editorIndentGuide.background1',
  'editor.indent_guide_active': 'editorIndentGuide.activeBackground1',
  'editor.document_highlight.read_background': 'editor.wordHighlightBackground',
  'editor.document_highlight.write_background': 'editor.wordHighlightStrongBackground',
  'editor.document_highlight.bracket_background': 'editorBracketMatch.background',
  'search.match_background': 'editor.findMatchBackground',
  'scrollbar.thumb.background': 'scrollbarSlider.background',
  'scrollbar.thumb.hover_background': 'scrollbarSlider.hoverBackground',
  'scrollbar.thumb.border': 'contrastBorder',
  'scrollbar.track.background': 'contrastBorder',
  'scrollbar.track.border': 'contrastBorder',
  'terminal.background': 'terminal.background',
  'terminal.foreground': 'terminal.foreground',
  'terminal.bright_foreground': 'terminal.ansiBrightWhite',
  'terminal.dim_foreground': 'terminal.ansiBrightBlack',
  'terminal.ansi.background': 'terminal.background',
  'link_text.hover': 'textLink.activeForeground',
  error: 'editorError.foreground',
  warning: 'editorWarning.foreground',
  info: 'editorInfo.foreground',
  hint: 'editorHint.foreground',
  success: 'gitDecoration.addedResourceForeground',
  created: 'gitDecoration.addedResourceForeground',
  'created.background': 'diffEditor.insertedLineBackground',
  modified: 'gitDecoration.modifiedResourceForeground',
  deleted: 'gitDecoration.deletedResourceForeground',
  'deleted.background': 'diffEditor.removedLineBackground',
  renamed: 'gitDecoration.renamedResourceForeground',
  conflict: 'gitDecoration.conflictingResourceForeground',
  ignored: 'gitDecoration.ignoredResourceForeground',
  hidden: 'disabledForeground',
  predictive: 'descriptionForeground',
};

// Zed capture -> semantic token, with TextMate scope overrides where applicable.
const syntaxColors = {
  attribute: ['decorator'],
  boolean: ['number'],
  comment: ['comment'],
  'comment.doc': ['comment'],
  constant: ['number'],
  constructor: ['function'],
  embedded: ['variable'],
  emphasis: ['variable'],
  'emphasis.strong': ['variable'],
  enum: ['type'],
  function: ['function'],
  'function.method': ['method'],
  'function.builtin': ['function'],
  keyword: ['keyword'],
  label: ['label'],
  link_text: ['type'],
  link_uri: ['type'],
  namespace: ['namespace'],
  number: ['number'],
  operator: ['operator'],
  predictive: ['comment'],
  preproc: ['macro'],
  property: ['property'],
  punctuation: ['variable', 'punctuation.separator.comma'],
  'punctuation.bracket': ['variable', 'punctuation.section.block.begin'],
  'punctuation.delimiter': ['variable', 'punctuation.separator.comma'],
  'punctuation.list_marker': ['keyword'],
  'punctuation.special': ['operator'],
  string: ['string', 'string.quoted'],
  'string.escape': ['regexp'],
  'string.regex': ['regexp'],
  'string.special': ['string'],
  'string.special.symbol': ['typeParameter'],
  tag: ['label'],
  'text.literal': ['string'],
  title: ['function'],
  type: ['type'],
  'type.builtin': ['type'],
  variable: ['variable'],
  'variable.builtin': ['variable', 'support.variable'],
  'variable.parameter': ['parameter'],
  'variable.special': ['variable.readonly'],
};

const themes = ['light', 'dark'].map((appearance) => {
  const theme = JSON.parse(readFileSync(new URL(`themes/tracer-${appearance}-color-theme.json`, root), 'utf8'));
  const color = (key) => {
    const value = theme.colors[key];
    if (!/^#[\da-f]{6}([\da-f]{2})?$/i.test(value ?? '')) {
      throw new Error(`Missing or invalid ${appearance} color: ${key}`);
    }
    return value;
  };
  const style = Object.fromEntries(Object.entries(interfaceColors).map(([target, source]) => [target, color(source)]));
  for (const name of ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']) {
    style[`terminal.ansi.${name.toLowerCase()}`] = color(`terminal.ansi${name}`);
    style[`terminal.ansi.bright_${name.toLowerCase()}`] = color(`terminal.ansiBright${name}`);
  }
  style.accents = [color('button.background')];
  style.players = [{
    cursor: color('editorCursor.foreground'),
    background: color('button.background'),
    selection: color('editor.selectionBackground'),
  }];
  style.syntax = Object.fromEntries(Object.entries(syntaxColors).map(([capture, [token, scope]]) => {
    const semantic = theme.semanticTokenColors[token];
    if (!semantic) throw new Error(`Missing ${appearance} semantic token: ${token}`);
    const highlight = { color: typeof semantic === 'string' ? semantic : semantic.foreground };
    if (semantic.italic) highlight.font_style = 'italic';
    if (scope) {
      for (const rule of theme.tokenColors) {
        const scopes = Array.isArray(rule.scope) ? rule.scope : (rule.scope ?? '').split(',').map((entry) => entry.trim());
        if (scopes.includes(scope) && rule.settings.foreground) highlight.color = rule.settings.foreground;
      }
    }
    return [capture, highlight];
  }));
  style.syntax.emphasis.font_style = 'italic';
  style.syntax['emphasis.strong'].font_weight = 700;
  style.syntax.title.font_weight = 700;
  return { name: theme.name, appearance, style };
});

const family = {
  $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
  name: 'Tracer',
  author: 'MommysGoodPuppy',
  themes,
};
const target = new URL('zed/themes/tracer.json', root);
const output = `${JSON.stringify(family, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw new Error('Zed themes are out of date. Run node scripts/generate-zed.mjs');
} else {
  mkdirSync(new URL('zed/themes/', root), { recursive: true });
  writeFileSync(target, output);
}
