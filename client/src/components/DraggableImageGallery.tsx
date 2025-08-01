import { useState, useEffect, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { cn } from "@/lib/utils";

type ImageItemProps = {
  url: string;
  index: number;
  isMain: boolean;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  onDelete: (index: number) => void;
  onSetMain: (index: number) => void;
};

const ItemType = "IMAGE";

const DraggableImage = ({ url, index, isMain, moveImage, onDelete, onSetMain }: ImageItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;
      
      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref} 
      className={cn(
        "relative group cursor-move", 
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      <div className={cn(
        "aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden",
        isMain ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/50",
        isDragging ? "shadow-lg" : ""
      )}>
        <img 
          src={url} 
          alt={`Property ${index}`} 
          className="object-cover w-full h-full" 
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" fill="none"%3E%3Crect width="150" height="150" fill="%23EEEEEE"/%3E%3Cpath d="M75 90L60 70L45 90" stroke="%23CCCCCC" stroke-width="2"/%3E%3Ccircle cx="85" cy="60" r="5" stroke="%23CCCCCC" stroke-width="2"/%3E%3C/svg%3E';
          }} 
        />

        {isMain && (
          <div className="absolute top-0 left-0 bg-primary text-white py-1 px-2 text-xs font-medium rounded-br-md">
            Imagen principal
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          type="button"
          className="bg-primary text-white rounded-md p-1.5 shadow-md hover:bg-primary/90"
          onClick={() => onSetMain(index)}
          title={isMain ? "Imagen principal" : "Establecer como imagen principal"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      <button 
        type="button"
        className="absolute bottom-2 right-2 bg-red-500 text-white rounded-md p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        onClick={() => onDelete(index)}
        title="Eliminar imagen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

type DraggableImageGalleryProps = {
  images: string[];
  mainImageIndex?: number;
  onChange: (newImages: string[], mainImageIndex: number) => void;
};

export function DraggableImageGallery({ images, mainImageIndex: propMainImageIndex, onChange }: DraggableImageGalleryProps) {
  const [imageList, setImageList] = useState<string[]>(images || []);
  const [mainImageIndex, setMainImageIndex] = useState<number>(propMainImageIndex ?? -1);

  useEffect(() => {
    setImageList(images || []);
  }, [images]);

  useEffect(() => {
    if (propMainImageIndex !== undefined) {
      setMainImageIndex(propMainImageIndex);
    }
  }, [propMainImageIndex]);

  useEffect(() => {
    if (imageList.length === 0) {
      setMainImageIndex(-1);
    }
  }, [imageList]);

  const moveImage = (dragIndex: number, hoverIndex: number) => {
    const newImages = [...imageList];
    const dragImage = newImages[dragIndex];
    
    // Remove the dragged item
    newImages.splice(dragIndex, 1);
    // Insert it at the new position
    newImages.splice(hoverIndex, 0, dragImage);
    
    // Update the main image index if it was affected by the reordering
    let newMainIndex = mainImageIndex;
    if (mainImageIndex === dragIndex) {
      newMainIndex = hoverIndex;
    } else if (
      (mainImageIndex > dragIndex && mainImageIndex <= hoverIndex) ||
      (mainImageIndex < dragIndex && mainImageIndex >= hoverIndex)
    ) {
      // Adjust the main image index based on the direction of movement
      newMainIndex = mainImageIndex + (dragIndex < hoverIndex ? -1 : 1);
    }
    
    setImageList(newImages);
    setMainImageIndex(newMainIndex);
    onChange(newImages, newMainIndex);
  };

  const handleDelete = (index: number) => {
    const newImages = [...imageList];
    newImages.splice(index, 1);
    
    // Adjust main image index if needed
    let newMainIndex = mainImageIndex;
    if (index === mainImageIndex) {
      // If the main image was deleted, no main image is selected
      newMainIndex = -1;
    } else if (index < mainImageIndex && mainImageIndex > 0) {
      // If an image before the main was deleted, decrement the main index
      newMainIndex = mainImageIndex - 1;
    }
    
    setImageList(newImages);
    setMainImageIndex(newMainIndex);
    onChange(newImages, newMainIndex);
  };

  const handleSetMain = (index: number) => {
    setMainImageIndex(index);
    onChange(imageList, index);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {!imageList || imageList.length === 0 ? (
        <div className="bg-gray-50 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-gray-500">No hay imágenes para mostrar. Por favor, añade imágenes usando el campo arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>Arrastra para reordenar las imágenes</span>
          </div>
          {mainImageIndex === -1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium">Selecciona una imagen principal haciendo clic en el botón ✓</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {imageList.map((url, index) => (
              <DraggableImage
                key={index}
                url={url}
                index={index}
                isMain={index === mainImageIndex}
                moveImage={moveImage}
                onDelete={handleDelete}
                onSetMain={handleSetMain}
              />
            ))}
          </div>
        </div>
      )}
    </DndProvider>
  );
}