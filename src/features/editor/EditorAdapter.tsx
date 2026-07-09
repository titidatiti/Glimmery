import { useEffect, useRef } from 'react';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import '@milkdown/crepe/theme/common/style.css';
import { MOBILE_PORTRAIT_QUERY, useComposingInput } from '@/ui';
import { glimmeryCodeMirrorTheme } from './codeMirrorTheme';
import './editorCrepeTheme.css';
import './editorCrepeOverrides.css';
import { DEFAULT_DOCUMENT_TITLE } from '@/core/documents';
import { activeLinePlugin } from './plugins/activeLinePlugin';
import { blockDragFixPlugin } from './plugins/blockDragFixPlugin';
import { comfortScrollPlugin } from './plugins/comfortScrollPlugin';
import { titleNavigationPlugin } from './plugins/titleNavigationPlugin';
import { keystrokeAudioPlugin } from './plugins/keystrokeAudioPlugin';
import { blockHandleCrepeConfig } from './plugins/blockHandleConfig';
import { useKeystrokeAudio } from './useKeystrokeAudio';
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
      crepe.editor.use(titleNavigationPlugin);
      crepe.editor.use(blockDragFixPlugin);
      crepe.editor.use(keystrokeAudioPlugin);
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
  useKeystrokeAudio();
  const titleInput = useComposingInput(title, onTitleChange);

  const focusBodyFromTitle = (input: HTMLInputElement) => {
    const proseMirror = input
      .closest('.editorWritingSurface')
      ?.querySelector('.ProseMirror');
    if (proseMirror instanceof HTMLElement) {
      proseMirror.focus();
    }
  };

  return (
    <div className="editorWritingSurface">
      <input
        type="text"
        className={`editorWritingTitle ${styles.titleInput}`}
        value={titleInput.value}
        onChange={titleInput.onChange}
        onCompositionStart={titleInput.onCompositionStart}
        onCompositionEnd={titleInput.onCompositionEnd}
        onKeyDown={(event) => {
          if (readOnly) return;
          if (
            event.key !== 'ArrowDown' ||
            event.shiftKey ||
            event.altKey ||
            event.metaKey ||
            event.ctrlKey
          ) {
            return;
          }
          const input = event.currentTarget;
          if (input.selectionStart !== input.value.length) return;
          if (input.selectionEnd !== input.value.length) return;
          event.preventDefault();
          focusBodyFromTitle(input);
        }}
        placeholder={DEFAULT_DOCUMENT_TITLE}
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
