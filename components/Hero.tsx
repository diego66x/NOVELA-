import React from 'react';
import { Play, Info } from 'lucide-react';
import { Content } from '../types';

interface HeroProps {
  content: Content;
  onPlay: () => void;
  onMoreInfo: () => void;
}

const Hero: React.FC<HeroProps> = ({ content, onPlay, onMoreInfo }) => {
  return (
    // Altura ajustada: 70vh no mobile (mais alto) e 56.25vw no desktop (formato cinema)
    <div className="relative h-[70vh] md:h-[56.25vw] max-h-[85vh] w-full">
      {/* Background Image */}
      <img 
        src={content.coverUrl} 
        alt={content.title}
        className="w-full h-full object-cover object-center md:object-top brightness-75"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-black/40 to-transparent opacity-90"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>

      {/* Content */}
      <div className="absolute bottom-[20%] md:top-[30%] left-4 md:left-12 max-w-xl space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg leading-tight">
          {content.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm md:text-base font-medium text-green-400">
           <span>{content.match}% Match</span>
           <span className="text-gray-300">{content.year}</span>
           <span className="border border-gray-400 px-1 text-gray-300 text-xs">{content.ageRating}</span>
        </div>

        <p className="text-white text-sm md:text-lg drop-shadow-md line-clamp-3 md:line-clamp-none max-w-[90%] md:max-w-full">
          {content.description}
        </p>

        <div className="flex items-center gap-3 pt-4">
          <button 
            onClick={onPlay}
            className="flex items-center gap-2 bg-white text-black px-6 py-2 md:py-3 rounded font-bold hover:bg-opacity-80 transition"
          >
            <Play fill="black" size={20} />
            Assistir
          </button>
          <button 
            onClick={onMoreInfo}
            className="flex items-center gap-2 bg-gray-500/70 text-white px-6 py-2 md:py-3 rounded font-bold hover:bg-gray-500/50 transition"
          >
            <Info size={20} />
            Mais Informações
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;