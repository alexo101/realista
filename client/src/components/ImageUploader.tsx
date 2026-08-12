import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X, Image, FileImage, AlertCircle, Sparkles } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useLanguage } from "@/contexts/language-context";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  onMultipleImagesUploaded?: (imageUrls: string[]) => void;
  maxFiles?: number;
  multiple?: boolean;
  className?: string;
  currentImageCount?: number;
  totalLimit?: number;
}

export function ImageUploader({ 
  onImageUploaded, 
  onMultipleImagesUploaded, 
  maxFiles = 20, 
  multiple = false, 
  className,
  currentImageCount = 0,
  totalLimit = 100
}: ImageUploaderProps) {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);
  const remainingSlots = totalLimit - currentImageCount;
  const isAtLimit = remainingSlots <= 0;
  const effectiveMaxFiles = Math.min(maxFiles, remainingSlots);

  const compressImage = async (file: File): Promise<{ compressedFile: File; wasCompressed: boolean; savings: number }> => {
    const originalSize = file.size;
    const maxSizeMB = 1;
    const maxWidthOrHeight = 2048;
    
    if (originalSize <= maxSizeMB * 1024 * 1024) {
      return { compressedFile: file, wasCompressed: false, savings: 0 };
    }

    try {
      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        initialQuality: 0.85,
      };

      const compressedFile = await imageCompression(file, options);
      const savings = Math.round(((originalSize - compressedFile.size) / originalSize) * 100);
      
      return { 
        compressedFile, 
        wasCompressed: true, 
        savings 
      };
    } catch (error) {
      console.error("Compression failed, using original:", error);
      return { compressedFile: file, wasCompressed: false, savings: 0 };
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    if (isAtLimit) {
      toast({
        title: t("propertyForm.upload.limit_reached"),
        description: t("propertyForm.upload.limit_reached_desc", { total: totalLimit }),
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    if (fileArray.length > effectiveMaxFiles) {
      toast({
        title: t("propertyForm.upload.too_many_files"),
        description: remainingSlots < maxFiles 
          ? t("propertyForm.upload.remaining_files", { remaining: remainingSlots, selected: fileArray.length })
          : t("propertyForm.upload.batch_limit", { max: maxFiles, selected: fileArray.length }),
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t("propertyForm.upload.invalid_file"),
          description: t("propertyForm.upload.invalid_file_desc", { name: file.name }),
          variant: "destructive",
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: t("propertyForm.upload.file_too_large"),
          description: t("propertyForm.upload.file_too_large_desc", { name: file.name }),
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);
    setCompressionStatus(null);
    const uploadedUrls: string[] = [];
    let totalSavings = 0;
    let compressedCount = 0;

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        setCompressionStatus(t("propertyForm.upload.optimizing", { current: i + 1, total: fileArray.length }));
        const { compressedFile, wasCompressed, savings } = await compressImage(file);
        
        if (wasCompressed) {
          compressedCount++;
          totalSavings += savings;
        }

        setCompressionStatus(t("propertyForm.upload.uploading", { current: i + 1, total: fileArray.length }));
        
        const formData = new FormData();
        formData.append('image', compressedFile);

        const csrfToken = localStorage.getItem("csrfToken");
        const uploadResponse = await fetch("/api/property-images/upload-direct", {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const { imageUrl } = await uploadResponse.json() as { imageUrl: string };
        uploadedUrls.push(imageUrl);
        
        if (!multiple) {
          onImageUploaded(imageUrl);
        }
      }

      if (multiple && onMultipleImagesUploaded) {
        onMultipleImagesUploaded(uploadedUrls);
      }

      const avgSavings = compressedCount > 0 ? Math.round(totalSavings / compressedCount) : 0;
      
      toast({
        title: t("propertyForm.upload.uploaded", { count: uploadedUrls.length }),
        description: t("propertyForm.upload.uploaded_desc"),
      });

      event.target.value = '';
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: t("common.error"),
        description: t("propertyForm.upload.error"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setCompressionStatus(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAtLimit) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isAtLimit) {
      toast({
        title: t("propertyForm.upload.limit_reached"),
        description: t("propertyForm.upload.limit_reached_desc", { total: totalLimit }),
        variant: "destructive",
      });
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fakeEvent = {
        target: { files, value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  };

  const handleClick = () => {
    if (!isAtLimit) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileUpload}
        disabled={isUploading || isAtLimit}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isAtLimit 
            ? 'border-red-300 bg-red-50/50 cursor-not-allowed' 
            : isDragActive 
              ? 'border-primary bg-primary/5 scale-[1.02] cursor-pointer' 
              : 'border-gray-300 cursor-pointer hover:bg-gray-50/50 hover:border-primary'
          }
          ${isUploading ? 'cursor-not-allowed opacity-60' : ''}
        `}
        data-testid={multiple ? "drag-drop-multiple-images" : "drag-drop-single-image"}
      >
        {isAtLimit ? (
          <div className="flex flex-col items-center space-y-3">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-red-600">
                {t("propertyForm.upload.limit_reached_heading")}
              </h3>
              <p className="text-sm text-red-500">
                {t("propertyForm.upload.limit_reached_max", { total: totalLimit })}
              </p>
              <p className="text-xs text-gray-500">
                {t("propertyForm.upload.remove_existing")}
              </p>
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-600">
              {compressionStatus || t("propertyForm.upload.uploading_images")}
            </p>
            {compressionStatus?.startsWith(t("propertyForm.upload.optimizing_prefix")) && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t("propertyForm.upload.compressing")}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mx-auto mb-4">
              {multiple ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileImage className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
                  <FileImage className={`h-6 w-6 ${isDragActive ? 'text-primary' : 'text-gray-400'} -ml-3`} />
                </div>
              ) : (
                <Image className={`h-12 w-12 mx-auto ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className={`text-lg font-medium ${isDragActive ? 'text-primary' : 'text-gray-900'}`}>
                {isDragActive 
                  ? (multiple ? t("propertyForm.upload.drop_images") : t("propertyForm.upload.drop_image"))
                  : (multiple ? t("propertyForm.upload.drag_images") : t("propertyForm.upload.drag_image"))
                }
              </h3>
              <p className="text-sm text-gray-500">
                {t("propertyForm.upload.click_to_select")} {multiple ? t("propertyForm.upload.files") : t("propertyForm.upload.file")}
              </p>
              <p className="text-xs text-gray-400">
                {multiple 
                  ? t("propertyForm.upload.max_batch", { max: effectiveMaxFiles })
                  : t("propertyForm.upload.max_single")
                }
              </p>
              {multiple && currentImageCount > 0 && (
                <p className="text-xs text-blue-600 font-medium">
                  {t("propertyForm.upload.usage", { current: currentImageCount, total: totalLimit, remaining: remainingSlots })}
                </p>
              )}
            </div>
            
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                data-testid={multiple ? "button-upload-images" : "button-upload-image"}
              >
                <Upload className="h-4 w-4 mr-2" />
                {multiple ? t("propertyForm.upload.select_images") : t("propertyForm.upload.select_image")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ImageGalleryProps {
  images: string[];
  onRemoveImage?: (index: number) => void;
  mainImageIndex?: number;
  onSetMainImage?: (index: number) => void;
}

export function ImageGallery({ 
  images, 
  onRemoveImage, 
  mainImageIndex = 0, 
  onSetMainImage 
}: ImageGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((imageUrl, index) => (
        <div key={index} className="relative group">
          <img
            src={imageUrl}
            alt={`Imagen ${index + 1}`}
            className={`w-full h-32 object-cover rounded-lg border-2 ${
              index === mainImageIndex ? 'border-blue-500' : 'border-gray-200'
            }`}
          />
          
          {index === mainImageIndex && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
              Principal
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onSetMainImage && index !== mainImageIndex && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onSetMainImage(index)}
                className="h-6 w-6 p-0"
              >
                ⭐
              </Button>
            )}
            {onRemoveImage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onRemoveImage(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
