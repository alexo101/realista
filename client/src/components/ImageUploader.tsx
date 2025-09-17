import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X } from "lucide-react";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUploader({ onImageUploaded, maxFiles = 5, className }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo de imagen.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get upload URL from backend
      const uploadResponse = await apiRequest("POST", "/api/property-images/upload", {});
      const { uploadURL } = uploadResponse;

      // Upload file directly to object storage
      const uploadResult = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload image");
      }

      // Extract the image URL from the upload URL (remove query parameters)
      const imageUrl = uploadURL.split('?')[0];
      
      // Call the callback with the image URL
      onImageUploaded(imageUrl);

      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente.",
      });

      // Reset the input
      event.target.value = '';
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Inténtalo de nuevo.",
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
            {isUploading ? "Subiendo..." : "Subir imagen"}
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