import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X } from "lucide-react";

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
  const { toast } = useToast();

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
        
        const uploadResponse = await apiRequest("POST", "/api/property-images/upload-direct", formData, {
          'Content-Type': undefined // Let browser set multipart boundary
        });
        
        const { imageUrl } = uploadResponse;
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

  return (
    <div className={className}>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileUpload}
        disabled={isUploading}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          className="cursor-pointer"
          asChild
        >
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {isUploading ? "Subiendo..." : multiple ? "Subir imágenes" : "Subir imagen"}
          </span>
        </Button>
      </label>
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