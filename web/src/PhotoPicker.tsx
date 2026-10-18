import { useEffect, useMemo, useRef } from "react";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  max?: number;
}

export default function PhotoPicker({ files, onChange, disabled, max = 4 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function add(list: FileList | null) {
    if (!list) return;
    const images = Array.from(list).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    onChange([...files, ...images].slice(0, max));
  }

  return (
    <div>
      <div
        className={`dropzone${disabled ? " disabled" : ""}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled) add(e.dataTransfer.files);
        }}
      >
        <strong>Upload photos of your garment</strong>
        <span>Drag or click · up to {max} photos · JPG, PNG or WEBP</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="thumbs">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <img src={previews[i]} alt={f.name} />
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                disabled={disabled}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
