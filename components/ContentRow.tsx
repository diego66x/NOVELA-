import React from 'react';
import { Content, UserProgress } from '../types';
import ContentCard from './ContentCard';
import { ChevronRight, Plus } from 'lucide-react';

interface ContentRowProps {
  title: string;
  contents: Content[];
  favorites: string[];
  userProgress?: UserProgress;
  isEditMode: boolean;
  onContentClick: (content: Content) => void;
  onEditClick: (content: Content) => void;
  onToggleFavorite: (id: string) => void;
  onAddContent: () => void; // Nova prop
}

const ContentRow: React.FC<ContentRowProps> = ({ 
  title, 
  contents, 
  favorites,
  userProgress,
  isEditMode, 
  onContentClick,
  onEditClick,
  onToggleFavorite,
  onAddContent
}) => {
  // Removi a verificação de contents.length === 0 para permitir mostrar apenas o botão "+" se estiver vazio

  const getProgress = (content: Content): number => {
    if (!userProgress || !userProgress[content.id]) return 0;
    
    const progress = userProgress[content.id];
    
    if (content.type !== 'filmes' && progress.episodeId && content.episodes) {
      const ep = content.episodes.find(e => e.id === progress.episodeId);
      if (ep && ep.duration > 0) {
        return Math.min(100, Math.round((progress.timestamp / ep.duration) * 100));
      }
    }
    
    if (progress.timestamp > 60) {
       return 45; 
    }
    
    return 0;
  };

  return (
    <div className="mb-8 md:mb-12 px-4 md:pl-12 group">
      <div className="flex items-center gap-2 mb-4 group/title cursor-pointer">
        <h2 className="text-white text-lg md:text-2xl font-bold transition duration-300 group-hover/title:text-red-500">
          {title}
        </h2>
        <div className="hidden md:flex text-cyan-200 opacity-0 group-hover/title:opacity-100 transition duration-300 text-sm font-semibold items-center">
          Ver tudo <ChevronRight size={16} />
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-2 gap-3 md:flex md:gap-4 md:overflow-x-auto md:no-scrollbar md:pb-6 md:scroll-smooth">
          
          {/* Add New Card - Always visible first */}
          <div 
            onClick={onAddContent}
            className="w-full md:min-w-[200px] md:w-[200px] aspect-[2/3] bg-[#1a1a1a] rounded-md border-2 border-dashed border-gray-700 hover:border-white cursor-pointer flex flex-col items-center justify-center group transition-all"
          >
            <Plus className="text-gray-500 group-hover:text-white transition-colors mb-2" size={48} />
            <span className="text-gray-500 group-hover:text-white font-bold text-sm">Adicionar</span>
          </div>

          {contents.map((content) => (
            <div key={content.id} className="w-full md:min-w-[200px] md:w-[200px]">
              <ContentCard 
                content={content}
                isEditMode={isEditMode}
                onCardClick={() => onContentClick(content)}
                onEditClick={() => onEditClick(content)}
                isFavorite={favorites.includes(content.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(content.id);
                }}
                progress={getProgress(content)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentRow;