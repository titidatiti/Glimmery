import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
} from 'react';

/** 受控文本框在拼音/日文 IME 组合输入期间不向外部同步，避免「n你好」类残字 */
export function useComposingInput(value: string, onValueChange: (value: string) => void) {
  const [draft, setDraft] = useState(value);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (!isComposingRef.current) {
      setDraft(value);
    }
  }, [value]);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDraft(next);
    if (!isComposingRef.current) {
      onValueChange(next);
    }
  };

  const onCompositionStart = () => {
    isComposingRef.current = true;
  };

  const onCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const next = event.currentTarget.value;
    setDraft(next);
    onValueChange(next);
  };

  return {
    value: draft,
    onChange,
    onCompositionStart,
    onCompositionEnd,
  };
}
