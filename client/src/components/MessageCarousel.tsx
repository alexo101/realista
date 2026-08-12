import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/language-context";

interface Message {
  id: number;
  key: string;
}

const messages: Message[] = [
  {
    id: 1,
    key: "home.carousel_1"
  },
  {
    id: 2,
    key: "home.carousel_2"
  },
  {
    id: 3,
    key: "home.carousel_3"
  }
];

export function MessageCarousel() {
  const { t } = useLanguage();
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

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full">
      {/* Main message display */}
      <div className="relative min-h-[60px] md:min-h-[60px] flex items-center justify-center px-4">
        <p className="text-sm md:text-lg text-center text-gray-600 transition-all duration-500 ease-in-out leading-relaxed">
          {t(messages[currentIndex].key)}
        </p>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center space-x-2 mt-4">
        {messages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-primary scale-110' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={t("home.carousel_go_to", { number: index + 1 })}
          />
        ))}
      </div>
    </div>
  );
}