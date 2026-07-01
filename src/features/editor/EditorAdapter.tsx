import { useEffect, useRef } from 'react';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import '@milkdown/crepe/theme/common/style.css';
import styles from './EditorAdapter.module.css';

export interface EditorAdapterProps {
  title: string;
  initialContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onBeginWriting?: () => void;
  readOnly?: boolean;
}

function BodyEditor({
  initialContent,
  onContentChange,
  onBeginWriting,
  readOnly = false,
}: Pick<
  EditorAdapterProps,
  'initialContent' | 'onContentChange' | 'onBeginWriting' | 'readOnly'
>) {
  const onChangeRef = useRef(onContentChange);
  const crepeRef = useRef<Crepe | null>(null);
  const initialContentRef = useRef(initialContent);
  onChangeRef.current = onContentChange;

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
            text: '正文',
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

  return (
    <div
      className={styles.bodyEditor}
      onPointerDown={() => onBeginWriting?.()}
    >
      <Milkdown />
    </div>
  );
}

export function EditorAdapter({
  title,
  initialContent,
  onTitleChange,
  onContentChange,
  onBeginWriting,
  readOnly = false,
}: EditorAdapterProps) {
  return (
    <div
      className={styles.editorWrapper}
      onPointerDown={() => onBeginWriting?.()}
    >
      <input
        type="text"
        className={styles.titleInput}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="标题"
        aria-label="文稿标题"
        onPointerDown={(e) => e.stopPropagation()}
        onFocus={() => onBeginWriting?.()}
      />
      <MilkdownProvider>
        <BodyEditor
          initialContent={initialContent}
          onContentChange={onContentChange}
          onBeginWriting={onBeginWriting}
          readOnly={readOnly}
        />
      </MilkdownProvider>
    </div>
  );
}
