export interface BlockEditorProps<T> {
  content: T;
  readOnly: boolean;
  onChange: (value: T) => void;
}

