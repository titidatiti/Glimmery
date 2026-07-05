import { describe, expect, it } from 'vitest';
import { EditorState, TextSelection } from '@milkdown/kit/prose/state';
import { Schema, type Node as ProseNode } from '@milkdown/kit/prose/model';

import { isInFirstTopLevelBlock } from './titleNavigationPlugin';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'text*', group: 'block', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
  },
});

function docWithTwoParagraphs(): ProseNode {
  return schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text('第一行')]),
    schema.node('paragraph', null, [schema.text('第二行')]),
  ]);
}

function selectionAt(doc: ProseNode, pos: number): EditorState {
  return EditorState.create({
    doc,
    selection: TextSelection.near(doc.resolve(pos)),
  });
}

describe('isInFirstTopLevelBlock', () => {
  it('首段内为 true', () => {
    const doc = docWithTwoParagraphs();
    const state = selectionAt(doc, 2);
    expect(isInFirstTopLevelBlock(state)).toBe(true);
  });

  it('第二段为 false', () => {
    const doc = docWithTwoParagraphs();
    const state = selectionAt(doc, 9);
    expect(isInFirstTopLevelBlock(state)).toBe(false);
  });
});
