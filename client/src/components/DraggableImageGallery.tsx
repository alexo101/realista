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
        "relative group", 
        isDragging ? "opacity-50" : "opacity-100",
        isMain ? "border-2 border-primary" : ""
      )}
    >
      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
        <img 
          src={url} 
          alt={`Property ${index}`} 
          className="object-cover w-full h-full" 
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/150';
          }} 
        />
      </div>
      <div className="absolute top-1 left-1 flex gap-1">
        <button 
          type="button"
          className={cn(
            "bg-green-500 text-white rounded-full p-1",
            isMain ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
          onClick={() => onSetMain(index)}
          title={isMain ? "Main image" : "Set as main image"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
      <button 
        type="button"
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(index)}
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
  onChange: (newImages: string[], mainImageIndex: number) => void;
};

export function DraggableImageGallery({ images, onChange }: DraggableImageGalleryProps) {
  const [imageList, setImageList] = useState<string[]>(images || []);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);

  useEffect(() => {
    setImageList(images || []);
  }, [images]);

  useEffect(() => {
    if (imageList.length === 0 && mainImageIndex > 0) {
      setMainImageIndex(0);
    }
  }, [imageList, mainImageIndex]);

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
      // If the main image was deleted, set the first image as main
      newMainIndex = newImages.length > 0 ? 0 : -1;
    } else if (index < mainImageIndex) {
      // If an image before the main was deleted, decrement the main index
      newMainIndex = mainImageIndex - 1;
    }
    
    setImageList(newImages);
    setMainImageIndex(newMainIndex >= 0 ? newMainIndex : 0);
    onChange(newImages, newMainIndex >= 0 ? newMainIndex : 0);
  };

  const handleSetMain = (index: number) => {
    setMainImageIndex(index);
    onChange(imageList, index);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-3 gap-2 mt-2">
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
    </DndProvider>
  );
}