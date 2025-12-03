import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X, Image, FileImage, AlertCircle, Sparkles } from "lucide-react";
import imageCompression from "browser-image-compression";

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
        title: "Límite alcanzado",
        description: `Has alcanzado el límite máximo de ${totalLimit} imágenes para esta propiedad. Elimina algunas imágenes existentes para poder subir nuevas.`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    if (fileArray.length > effectiveMaxFiles) {
      toast({
        title: "Demasiados archivos",
        description: remainingSlots < maxFiles 
          ? `Solo puedes subir ${remainingSlots} imagen(es) más. Has seleccionado ${fileArray.length}.`
          : `Puedes subir un máximo de ${maxFiles} imágenes a la vez. Has seleccionado ${fileArray.length}.`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: `${file.name} no es una imagen válida. Solo se permiten archivos PNG, JPG, GIF y WebP.`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} supera el límite de 50MB. Por favor, usa una imagen más pequeña.`,
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
        
        setCompressionStatus(`Optimizando imagen ${i + 1} de ${fileArray.length}...`);
        const { compressedFile, wasCompressed, savings } = await compressImage(file);
        
        if (wasCompressed) {
          compressedCount++;
          totalSavings += savings;
        }

        setCompressionStatus(`Subiendo imagen ${i + 1} de ${fileArray.length}...`);
        
        const formData = new FormData();
        formData.append('image', compressedFile);
        
        const uploadResponse = await fetch("/api/property-images/upload-direct", {
          method: "POST",
          body: formData,
          credentials: "include",
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
        title: compressedCount > 0 ? "Imágenes optimizadas y subidas" : "Imagen(es) subida(s)",
        description: compressedCount > 0 
          ? `${uploadedUrls.length} imagen(es) subida(s). ${compressedCount} optimizada(s) automáticamente (${avgSavings}% menos tamaño).`
          : `${uploadedUrls.length} imagen(es) subida(s) correctamente.`,
      });

      event.target.value = '';
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la(s) imagen(es). Inténtalo de nuevo.",
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
        title: "Límite alcanzado",
        description: `Has alcanzado el límite máximo de ${totalLimit} imágenes para esta propiedad.`,
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
                Límite de imágenes alcanzado
              </h3>
              <p className="text-sm text-red-500">
                Has llegado al máximo de {totalLimit} imágenes permitidas.
              </p>
              <p className="text-xs text-gray-500">
                Elimina algunas imágenes existentes para poder subir nuevas.
              </p>
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-600">
              {compressionStatus || "Subiendo imágenes..."}
            </p>
            {compressionStatus?.includes("Optimizando") && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Comprimiendo para mejor rendimiento
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
                  ? (multiple ? 'Suelta las imágenes aquí' : 'Suelta la imagen aquí')
                  : (multiple ? 'Arrastra y suelta imágenes' : 'Arrastra y suelta una imagen')
                }
              </h3>
              <p className="text-sm text-gray-500">
                o haz clic para seleccionar {multiple ? 'archivos' : 'un archivo'}
              </p>
              <p className="text-xs text-gray-400">
                {multiple 
                  ? `Máximo ${effectiveMaxFiles} archivos por lote • PNG, JPG, WebP • Optimización automática` 
                  : 'Máximo 1 archivo • PNG, JPG, WebP • Optimización automática'
                }
              </p>
              {multiple && currentImageCount > 0 && (
                <p className="text-xs text-blue-600 font-medium">
                  {currentImageCount} de {totalLimit} imágenes usadas ({remainingSlots} disponibles)
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
                {multiple ? "Seleccionar imágenes" : "Seleccionar imagen"}
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
