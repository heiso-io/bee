"use client";

import { Plus } from "lucide-react";
import { ImageUploader } from "@bee/core/components/primitives/uploader";

export function LogoImage({
  value,
  onChange,
  className,
  fallback,
}: {
  value?: string;
  onChange?: (url: string | null) => void;
  className?: string;
  /** 沒上傳時顯示的預設圖（如出廠 logo） */
  fallback?: string;
}) {
  const displayValue = value || fallback;
  return (
    <div className="border-dashed rounded-md space-y-2">
      <ImageUploader
        className={className}
        value={displayValue}
        onUploadComplete={(file) => {
          onChange?.(file.url);
        }}
        onRemove={() => {
          onChange?.(null);
        }}
      >
        <div className="h-12 flex items-center justify-center">
          <Plus />
        </div>
      </ImageUploader>
    </div>
  );
}
