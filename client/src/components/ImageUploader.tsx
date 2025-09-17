import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X, Image, FileImage } from "lucide-react";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  onMultipleImagesUploaded?: (imageUrls: string[]) => void;
  maxFiles?: number;
  multiple?: boolean;
  className?: string;
}

export function ImageUploader({ 
  onImageUploaded, 
  onMultipleImagesUploaded, 
  maxFiles = 5, 
  multiple = false, 
  className 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate all files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: `${file.name} no es una imagen válida.`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} debe ser menor a 10MB.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // Upload each file
      for (const file of fileArray) {
        // Upload to our backend instead of direct object storage to avoid CORS
        const formData = new FormData();
        formData.append('image', file);
        
        const uploadResponse = await apiRequest("POST", "/api/property-images/upload-direct", formData);
        
        const { imageUrl } = uploadResponse as { imageUrl: string };
        uploadedUrls.push(imageUrl);
        
        // For single file mode, call the single callback immediately
        if (!multiple) {
          onImageUploaded(imageUrl);
        }
      }

      // For multiple file mode, call the multiple callback
      if (multiple && onMultipleImagesUploaded) {
        onMultipleImagesUploaded(uploadedUrls);
      }

      toast({
        title: "Imagen(es) subida(s)",
        description: `${uploadedUrls.length} imagen(es) subida(s) correctamente.`,
      });

      // Reset the input
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
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a fake event to reuse our existing upload logic
      const fakeEvent = {
        target: { files, value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileUpload}
        disabled={isUploading}
        className="hidden"
      />
      
      {/* Enhanced drag and drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50/50
          ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-gray-300'}
          ${isUploading ? 'cursor-not-allowed opacity-60' : 'hover:border-primary'}
        `}
        data-testid={multiple ? "drag-drop-multiple-images" : "drag-drop-single-image"}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-600">Subiendo imágenes...</p>
          </div>
        ) : (
          <>
            {/* Icon */}
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
            
            {/* Text content */}
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
                {multiple ? `Máximo ${maxFiles} archivos` : 'Máximo 1 archivo'} • PNG, JPG hasta 10MB
              </p>
            </div>
            
            {/* Action button */}
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
          
          {/* Main image indicator */}
          {index === mainImageIndex && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
              Principal
            </div>
          )}
          
          {/* Controls */}
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