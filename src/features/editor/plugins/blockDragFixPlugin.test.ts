import { describe, expect, it } from 'vitest';
import { NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import { Schema } from '@milkdown/kit/prose/model';

import { textSelectionAfterTextblockNode } from './blockDragFixPlugin';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    text: { group: 'inline' },
  },
});

describe('textSelectionAfterTextblockNode', () => {
  it('将文本块 NodeSelection 转为段内 TextSelection', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('hello')]),
    ]);
    const nodeSelection = NodeSelection.create(doc, 0);
    const textSelection = textSelectionAfterTextblockNode(nodeSelection);

    expect(textSelection).toBeInstanceOf(TextSelection);
    expect(textSelection!.from).toBeGreaterThan(0);
  });

  it('非文本块 NodeSelection 不处理', () => {
    const imageSchema = new Schema({
      nodes: {
        doc: { content: 'block+' },
        image: { group: 'block', atom: true, selectable: true },
        paragraph: { group: 'block', content: 'text*' },
        text: { group: 'inline' },
      },
    });
    const doc = imageSchema.node('doc', null, [
      imageSchema.node('image', { src: 'x.png' }),
    ]);
    const nodeSelection = NodeSelection.create(doc, 0);
    expect(textSelectionAfterTextblockNode(nodeSelection)).toBeNull();
  });
});
