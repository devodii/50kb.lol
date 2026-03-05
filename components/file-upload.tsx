"use client";

import * as React from "react";

import Image from "next/image";

import { CheckCircle, ImagePlus, Loader2, Pencil } from "lucide-react";
import {
  type DropzoneOptions,
  type FileRejection,
  useDropzone,
} from "react-dropzone";
import { toast } from "sonner";

import { useImageProcessor } from "@/integrations/image-transformer";
import { cn } from "@/lib/utils";

import { Skeleton } from "./ui/skeleton";

export interface FileWithPreview extends File {
  preview: string;
}

export interface FileUploadRef {
  open: () => void;
}

interface FileUploadProps {
  id?: string;
  value?: Array<FileWithPreview>;
  onFilesChange?: (files: FileWithPreview[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;

  // When value is empty, show this URL as preview (e.g. saved logo from API)
  existingImageUrl?: string | null;

  // Rendered when there is a preview (file or existingImageUrl). Use for "Replace" / "Remove" etc.
  actions?: React.ReactNode;

  label?: React.ReactNode;
  labelClassName?: string;
  error?: React.ReactNode;
  errorClassName?: string;

  placeholder?: string;
  description?: string;
  className?: string;
  disabled?: boolean;

  shape?: "square" | "circle";

  accept?: DropzoneOptions["accept"];
  maxSize?: number;
  multiple?: boolean;
  noClick?: boolean;
  dropzoneOptions?: Omit<
    DropzoneOptions,
    "onDrop" | "accept" | "maxSize" | "multiple" | "noClick" | "disabled"
  >;

  showReplaceButtonOnHover?: boolean;
}

export const FileUpload = React.forwardRef<FileUploadRef, FileUploadProps>(
  (
    {
      value = [],
      onFilesChange,
      onFilesRejected,
      existingImageUrl,
      actions,
      label,
      labelClassName,
      error,
      errorClassName,
      placeholder = "Drag & drop an image here, or click to select",
      description,
      className,
      id,
      disabled = false,
      shape = "square",
      accept,
      maxSize,
      multiple = false,
      noClick = false,
      dropzoneOptions,
      showReplaceButtonOnHover = false,
    },
    ref,
  ) => {
    const { processImage } = useImageProcessor();
    const [isTransforming, setIsTransforming] = React.useState(false);

    const onDrop = React.useCallback(
      async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (acceptedFiles.length > 0) {
          setIsTransforming(true);
          try {
            if (!multiple && value.length > 0) {
              value.forEach((f) => URL.revokeObjectURL(f.preview));
            }

            const processedFiles = await Promise.all(
              acceptedFiles.map(async (file) => {
                const fileToUse = await processImage(file);
                const previewUrl = URL.createObjectURL(fileToUse);
                return Object.assign(fileToUse, {
                  preview: previewUrl,
                }) as FileWithPreview;
              }),
            );

            const next = multiple
              ? [...value, ...processedFiles]
              : processedFiles;
            onFilesChange?.(next);
          } finally {
            setIsTransforming(false);
          }
        }

        if (fileRejections.length > 0) {
          fileRejections.forEach(({ errors }) => {
            if (errors.some((error) => error.code === "file-too-large")) {
              toast.error(`File too large. Maximum size is ${maxSize} bytes.`);
            }
          });
          onFilesRejected?.(fileRejections);
        }
      },
      [multiple, value, onFilesChange, onFilesRejected, processImage],
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
      onDrop,
      disabled: disabled || isTransforming,
      accept,
      maxSize,
      multiple,
      noClick,
      ...dropzoneOptions,
    });

    React.useImperativeHandle(ref, () => ({ open }), [open]);

    React.useEffect(() => {
      return () => {
        value.forEach((f) => URL.revokeObjectURL(f.preview));
      };
    }, []);

    const currentFile = value[0];
    const hasFilePreview = currentFile?.type?.startsWith?.("image/");
    const hasFile = !!currentFile;
    const showExistingImage =
      !hasFile && !isTransforming && existingImageUrl?.trim();

    const previewUrl = hasFile
      ? currentFile.preview
      : showExistingImage
        ? existingImageUrl!
        : null;

    const showPreview = !!previewUrl;
    const isDisabled = disabled || isTransforming;

    return (
      <div className={cn("w-full", className)}>
        {label != null && (
          <p className={cn("text-sm font-medium text-content", labelClassName)}>
            {label}
          </p>
        )}

        <div
          {...getRootProps()}
          aria-disabled={isDisabled}
          aria-invalid={!!error}
          className={cn(
            "group border-input bg-muted/5 relative flex cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed transition-all",
            isDragActive &&
              "border-primary bg-primary/5 ring-4 ring-primary/10",
            isDisabled && "cursor-not-allowed opacity-50",
            !showPreview &&
              !isTransforming &&
              "hover:border-primary/50 hover:bg-muted/50",
            hasFile && !hasFilePreview && "border-solid bg-background",
            shape === "circle"
              ? "size-20 rounded-full"
              : "min-h-[260px] w-full rounded-2xl p-8",
            shape === "square" && "rounded-2xl",
          )}
        >
          <input
            {...getInputProps({ id })}
            aria-label={typeof label === "string" ? label : "Upload file"}
            disabled={isDisabled}
            aria-invalid={!!error}
          />

          {isTransforming && (
            <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              {shape === "square" && (
                <p className="text-sm font-medium">Processing image...</p>
              )}
            </div>
          )}

          {showPreview ? (
            <div className="flex w-full flex-col items-center gap-5">
              <div
                className={cn(
                  "relative flex items-center justify-center overflow-hidden bg-white shadow-sm",
                  shape === "circle"
                    ? "size-20 rounded-full"
                    : "h-28 w-full rounded-xl",
                )}
              >
                <Image
                  key={previewUrl}
                  src={previewUrl}
                  alt={currentFile?.name ?? "Preview"}
                  width={shape === "circle" ? 80 : 360}
                  height={shape === "circle" ? 80 : 140}
                  className={cn(
                    "object-contain",
                    shape === "circle"
                      ? "size-20 rounded-full"
                      : "h-auto max-h-24 w-auto",
                  )}
                />
                {showReplaceButtonOnHover && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                    <div className="flex flex-col items-center gap-2 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div
                        className="rounded-full bg-white/20 p-3 backdrop-blur-sm"
                        onClick={() => open()}
                      >
                        <Pencil
                          className={cn(
                            shape === "circle" ? "size-4" : "size-6",
                          )}
                        />
                      </div>
                      {shape === "square" && (
                        <p className="text-sm font-medium">Change image</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {actions != null && (
                <div className="flex w-full flex-wrap items-center justify-between gap-3 text-xs text-content-muted">
                  {actions}
                </div>
              )}
            </div>
          ) : hasFile ? (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <div className="rounded-full bg-emerald-500 p-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">File uploaded</p>
                <p className="text-muted-foreground break-all text-xs">
                  {currentFile.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <div className="bg-background rounded-full border p-4 shadow-sm">
                <ImagePlus className="text-muted-foreground h-6 w-6" />
              </div>
              {shape === "square" && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{placeholder}</p>
                  {description && (
                    <p className="text-muted-foreground text-xs">
                      {description}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {error != null && (
          <p
            className={cn("text-destructive text-sm", errorClassName)}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

FileUpload.displayName = "FileUpload";

interface FileUploadSkeletonProps {
  shape?: "square" | "circle";
  className?: string;
}

export const FileUploadSkeleton = ({
  shape = "square",
  className,
}: FileUploadSkeletonProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-input bg-muted/5 relative flex flex-col items-center justify-center overflow-hidden border-2 border-dashed transition-all",
          shape === "circle"
            ? "size-20 rounded-full"
            : "min-h-[260px] w-full rounded-2xl p-8",
          shape === "square" && "rounded-2xl",
        )}
      >
        <div className="flex w-full flex-col items-center gap-5">
          <div
            className={cn(
              "relative flex items-center justify-center overflow-hidden bg-white shadow-sm",
              shape === "circle"
                ? "size-20 rounded-full"
                : "h-28 w-full rounded-xl",
            )}
          >
            <Skeleton
              className={cn(
                "bg-muted/50",
                shape === "circle"
                  ? "size-20 rounded-full"
                  : "h-full w-full rounded-xl",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
