"use client";

import { useRef, useState } from "react";

export function ProfilePictureForm({
  action,
  currentImageUrl,
}: {
  action: (formData: FormData) => Promise<void>;
  currentImageUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={() => {
        // Optimistic preview only — the server action confirms the real save.
      }}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Profile" className="h-[280px] w-full object-cover" />
      ) : (
        <div className="flex h-[280px] w-full items-center justify-center bg-sage/40 text-sm text-white/70">
          No photo yet
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        name="profilePicture"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          formRef.current?.requestSubmit();
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="tracked-caps mt-3 w-full text-center text-sm text-gold hover:underline"
      >
        Change Profile Picture
      </button>
    </form>
  );
}
