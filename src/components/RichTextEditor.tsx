import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { ControllerRenderProps } from 'react-hook-form';

const QuillNoSSRWrapper = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps extends ControllerRenderProps {
  label?: string;
}

export default function RichTextEditor({ value, onChange, onBlur, name, label }: RichTextEditorProps) {
  useEffect(() => {
    // Optionally, focus or other logic
  }, []);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>{label}</label>}
      <QuillNoSSRWrapper value={value} onChange={onChange} onBlur={onBlur} theme="snow" />
    </div>
  );
}
