import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
  mainImageIndex?: number;
}

export function ImageGallery({ images, mainImageIndex = 0 }: ImageGalleryProps) {
  const [currentImage, setCurrentImage] = useState(mainImageIndex || 0);

  // If no images, display a placeholder
  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">No hay imágenes disponibles</p>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <div className="aspect-video relative overflow-hidden rounded-lg cursor-pointer">
            <img
              src={images[mainImageIndex]}
              alt="Property main"
              className="object-cover w-full h-full hover:scale-105 transition-transform"
            />
          </div>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl w-full">
          <div className="relative aspect-video">
            <img
              src={images[currentImage]}
              alt={`Property ${currentImage + 1}`}
              className="object-contain w-full h-full"
            />
            
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={previousImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Property ${index + 1}`}
              className={`aspect-video object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${
                index === currentImage ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setCurrentImage(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
