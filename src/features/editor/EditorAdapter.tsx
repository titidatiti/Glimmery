import { useEffect, useRef } from 'react';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import '@milkdown/crepe/theme/common/style.css';
import styles from './EditorAdapter.module.css';

export interface EditorAdapterProps {
  /** 仅在挂载时作为初始内容，切换文稿时通过外层 key  remount */
  initialContent: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

function EditorSurface({ initialContent, onChange, readOnly = false }: EditorAdapterProps) {
  const onChangeRef = useRef(onChange);
  const crepeRef = useRef<Crepe | null>(null);
  const initialContentRef = useRef(initialContent);
  onChangeRef.current = onChange;

  useEditor(
    (root) => {
      const crepe = new Crepe({
        root,
        defaultValue: initialContentRef.current,
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
    [],
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
