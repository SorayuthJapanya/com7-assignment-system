"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDailyReport } from "@/hooks/use-daily-report";
import { useUploadProfileImage } from "@/hooks/use-auth";
import { ImagePlus, X, Loader2 } from "lucide-react";

export default function ReportForm() {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadProfileImage();
  const { mutateAsync: createReport, isPending: isSubmitting } = useCreateDailyReport();

  const today = new Date().toISOString().slice(0, 10);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;

    let imageUrl: string | undefined;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      imageUrl = uploaded.url;
    }

    await createReport({
      date: today,
      description: description.trim(),
      imageUrl,
    });

    setDescription("");
    handleRemoveImage();
  };

  const isPending = isUploading || isSubmitting;

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">ส่งรายงานวันนี้ ({today})</h3>
      </div>

      <Textarea
        placeholder="วันนี้ทำอะไรบ้าง..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        className="resize-none"
      />

      {preview ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="preview"
            width={200}
            height={150}
            className="rounded-lg border object-cover"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1 shadow"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 w-fit cursor-pointer rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <ImagePlus className="size-4" />
          แนบรูปภาพ (ถ้ามี)
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending || !description.trim()}>
          {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          ส่งรายงาน
        </Button>
      </div>
    </div>
  );
}