import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Message {
  id: number;
  text: string;
}

const messages: Message[] = [
  {
    id: 1,
    text: "Propiedades, barrios y reseñas confiables. Todo lo que necesitas para encontrar el hogar ideal, en un solo lugar."
  },
  {
    id: 2,
    text: "Como inversor, encuentra los mejores agentes de cada barrio para invertir en las propiedades más rentables."
  },
  {
    id: 3,
    text: "La única plataforma \"todo en uno\" de España. Portal inmobiliario, CRM, gestor de agenda, gestor de reseñas: todo en un solo sitio y a un precio cómodo."
  }
];

export function MessageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === messages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === 0 ? messages.length - 1 : currentIndex - 1);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === messages.length - 1 ? 0 : currentIndex + 1);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full">
      {/* Main message display */}
      <div className="relative min-h-[60px] flex items-center justify-center px-12">
        <p className="text-lg text-center text-gray-600 transition-all duration-500 ease-in-out">
          {messages[currentIndex].text}
        </p>
        
        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Mensaje anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Siguiente mensaje"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center space-x-2 mt-4">
        {messages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-primary scale-110' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Ir al mensaje ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
        <div 
          className="bg-primary h-1 rounded-full transition-all duration-100 ease-linear"
          style={{ 
            width: isAutoPlaying ? `${((currentIndex + 1) / messages.length) * 100}%` : '0%'
          }}
        />
      </div>
    </div>
  );
}