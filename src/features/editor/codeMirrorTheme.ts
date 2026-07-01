import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

/** 随 Glimmery CSS 变量切换，替代 Crepe 默认 oneDark（浅色主题下代码块不可读） */
export const glimmeryCodeMirrorTheme = [
  EditorView.theme(
    {
      '&': {
        color: 'var(--color-text-body)',
        backgroundColor: 'var(--color-bg-elevated)',
      },
      '.cm-content': {
        caretColor: 'var(--color-caret)',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--color-caret)',
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        {
          backgroundColor: 'var(--color-selection-bg)',
          color: 'var(--color-selection-text)',
        },
      '.cm-activeLine': {
        backgroundColor: 'color-mix(in srgb, var(--color-active-line-bg) 55%, transparent)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--color-bg-elevated)',
        color: 'var(--color-text-muted)',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'color-mix(in srgb, var(--color-active-line-bg) 40%, transparent)',
      },
      '.cm-line': {
        color: 'var(--color-text-body)',
      },
    },
    { dark: false },
  ),
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.comment, color: 'var(--color-text-muted)', fontStyle: 'italic' },
      { tag: tags.lineComment, color: 'var(--color-text-muted)', fontStyle: 'italic' },
      { tag: tags.blockComment, color: 'var(--color-text-muted)', fontStyle: 'italic' },
      { tag: tags.name, color: 'var(--color-text-body)' },
      { tag: tags.variableName, color: 'var(--color-text-body)' },
      { tag: tags.propertyName, color: 'var(--color-text-body)' },
      { tag: tags.definition(tags.variableName), color: 'var(--color-text-body)' },
      { tag: tags.typeName, color: 'var(--color-accent)' },
      { tag: tags.className, color: 'var(--color-accent)' },
      { tag: tags.tagName, color: 'var(--color-accent)' },
      { tag: tags.keyword, color: 'var(--color-accent)' },
      { tag: tags.operator, color: 'var(--color-text-secondary)' },
      { tag: tags.modifier, color: 'var(--color-accent)' },
      { tag: tags.punctuation, color: 'var(--color-text-secondary)' },
      { tag: tags.bracket, color: 'var(--color-text-secondary)' },
      { tag: tags.squareBracket, color: 'var(--color-text-secondary)' },
      { tag: tags.paren, color: 'var(--color-text-secondary)' },
      { tag: tags.brace, color: 'var(--color-text-secondary)' },
      { tag: tags.number, color: 'var(--color-text-primary)' },
      { tag: tags.bool, color: 'var(--color-accent)' },
      { tag: tags.null, color: 'var(--color-accent)' },
      { tag: tags.string, color: 'var(--color-text-primary)' },
      { tag: tags.special(tags.string), color: 'var(--color-text-primary)' },
      { tag: tags.regexp, color: 'var(--color-text-primary)' },
      { tag: tags.meta, color: 'var(--color-text-muted)' },
      { tag: tags.link, color: 'var(--color-accent)', textDecoration: 'underline' },
      { tag: tags.heading, color: 'var(--color-text-heading)', fontWeight: 'bold' },
      { tag: tags.emphasis, fontStyle: 'italic' },
      { tag: tags.strong, fontWeight: 'bold' },
      { tag: tags.strikethrough, textDecoration: 'line-through' },
      { tag: tags.atom, color: 'var(--color-accent)' },
      { tag: tags.literal, color: 'var(--color-accent)' },
      { tag: tags.function(tags.variableName), color: 'var(--color-text-primary)' },
      { tag: tags.processingInstruction, color: 'var(--color-text-muted)' },
    ]),
  ),
];
