import { useEffect, useRef } from 'react';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import '@milkdown/crepe/theme/common/style.css';
import { MOBILE_PORTRAIT_QUERY, useComposingInput } from '@/ui';
import { glimmeryCodeMirrorTheme } from './codeMirrorTheme';
import './editorCrepeTheme.css';
import './editorCrepeOverrides.css';
import { activeLinePlugin } from './plugins/activeLinePlugin';
import { blockDragFixPlugin } from './plugins/blockDragFixPlugin';
import { comfortScrollPlugin } from './plugins/comfortScrollPlugin';
import { blockHandleCrepeConfig } from './plugins/blockHandleConfig';
import styles from './EditorAdapter.module.css';

const MOBILE_PORTRAIT_BODY_PLACEHOLDER = '正文，输入 / 插入块类型';

function resolveBodyPlaceholder(): string {
  if (typeof window === 'undefined') return '正文';
  return window.matchMedia(MOBILE_PORTRAIT_QUERY).matches
    ? MOBILE_PORTRAIT_BODY_PLACEHOLDER
    : '正文';
}

export interface EditorAdapterProps {
  title: string;
  initialContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
}

function BodyEditor({
  initialContent,
  onContentChange,
  readOnly = false,
}: Pick<EditorAdapterProps, 'initialContent' | 'onContentChange' | 'readOnly'>) {
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
          [CrepeFeature.BlockEdit]: true,
        },
        featureConfigs: {
          [CrepeFeature.Placeholder]: {
            text: resolveBodyPlaceholder(),
          },
          [CrepeFeature.BlockEdit]: blockHandleCrepeConfig,
          [CrepeFeature.CodeMirror]: {
            theme: glimmeryCodeMirrorTheme,
          },
        },
      });

      crepe.editor.use(activeLinePlugin);
      crepe.editor.use(comfortScrollPlugin);
      crepe.editor.use(blockDragFixPlugin);
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
    <div className={`glimmery-body-editor ${styles.bodyEditor}`}>
      <Milkdown />
    </div>
  );
}

export function EditorAdapter({
  title,
  initialContent,
  onTitleChange,
  onContentChange,
  readOnly = false,
}: EditorAdapterProps) {
  const titleInput = useComposingInput(title, onTitleChange);

  return (
    <div className="editorWritingSurface">
      <input
        type="text"
        className={`editorWritingTitle ${styles.titleInput}`}
        value={titleInput.value}
        onChange={titleInput.onChange}
        onCompositionStart={titleInput.onCompositionStart}
        onCompositionEnd={titleInput.onCompositionEnd}
        placeholder="标题"
        aria-label="文稿标题"
      />
      <MilkdownProvider>
        <BodyEditor
          initialContent={initialContent}
          onContentChange={onContentChange}
          readOnly={readOnly}
        />
      </MilkdownProvider>
    </div>
  );
}
