import { useEffect, useRef } from 'react';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import '@milkdown/crepe/theme/common/style.css';
import styles from './EditorAdapter.module.css';

export interface EditorAdapterProps {
  content: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

function EditorSurface({ content, onChange, readOnly = false }: EditorAdapterProps) {
  const onChangeRef = useRef(onChange);
  const crepeRef = useRef<Crepe | null>(null);
  onChangeRef.current = onChange;

  useEditor(
    (root) => {
      const crepe = new Crepe({
        root,
        defaultValue: content,
        features: {
          [CrepeFeature.Toolbar]: false,
          [CrepeFeature.TopBar]: false,
        },
        featureConfigs: {
          [CrepeFeature.Placeholder]: {
            text: '开始书写…',
          },
        },
      });

      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            onChangeRef.current(markdown);
          }
        });
      });

      crepe.setReadonly(readOnly);
      crepeRef.current = crepe;
      return crepe;
    },
    [content],
  );

  useEffect(() => {
    crepeRef.current?.setReadonly(readOnly);
  }, [readOnly]);

  return <Milkdown />;
}

export function EditorAdapter(props: EditorAdapterProps) {
  return (
    <MilkdownProvider>
      <div className={styles.editorWrapper}>
        <EditorSurface {...props} />
      </div>
    </MilkdownProvider>
  );
}
