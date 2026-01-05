import React from 'react';
import { Play, Plus, ThumbsUp, Edit3 } from 'lucide-react';
import { Content } from '../types';

interface ContentCardProps {
  content: Content;
  onCardClick: () => void;
  onEditClick: () => void;
  isEditMode: boolean;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  progress?: number; // 0 a 100
}

const ContentCard: React.FC<ContentCardProps> = ({ 
  content, 
  onCardClick, 
  onEditClick, 
  isEditMode,
  isFavorite,
  onToggleFavorite,
  progress
}) => {
  return (
    <div 
      className="relative group bg-[#141414] aspect-[2/3] w-full rounded-md overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:z-20 md:hover:scale-105 border border-transparent hover:border-gray-700"
      onClick={isEditMode ? onEditClick : onCardClick}
    >
      {/* Imagem configurada para cobrir todo o card (object-cover) e centralizar */}
      <img 
        src={content.thumbnailUrl} 
        alt={content.title}
        className="w-full h-full object-cover object-center transition-opacity duration-300 group-hover:opacity-30"
      />

      {/* Progress Bar (Visible if progress > 0) */}
      {!isEditMode && progress !== undefined && progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 z-10">
          <div 
            className="h-full bg-red-600 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center border-4 border-dashed border-yellow-500 z-30">
           <div className="text-center">
             <Edit3 className="mx-auto text-yellow-500 mb-2" />
             <p className="text-xs font-bold text-yellow-500 bg-black/50 px-2 py-1 rounded">EDITAR</p>
           </div>
        </div>
      )}

      {/* Hover Details (Visible on Desktop Hover ONLY) */}
      {!isEditMode && (
        <div className="hidden md:flex absolute inset-0 opacity-0 group-hover:opacity-100 flex-col justify-center items-center p-4 bg-[#141414]/90 backdrop-blur-sm transition-opacity duration-300">
           <h3 className="text-sm font-bold text-white mb-2 text-center line-clamp-2">{content.title}</h3>
           
           <div className="flex gap-2 mb-3">
             <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition">
               <Play fill="black" size={14} className="text-black ml-0.5" />
             </button>
             <button 
               onClick={onToggleFavorite}
               className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition"
             >
               {isFavorite ? <span className="text-green-500 font-bold">✓</span> : <Plus size={16} />}
             </button>
             <button className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition">
               <ThumbsUp size={14} />
             </button>
           </div>

           <div className="flex items-center gap-2 text-[10px] text-gray-300">
             <span className="text-green-400 font-bold">{content.match}% Match</span>
             <span className="border border-gray-500 px-1">{content.ageRating}</span>
           </div>

           <div className="flex flex-wrap justify-center gap-1 mt-2">
             {content.genres.slice(0, 2).map(g => (
               <span key={g} className="text-[9px] text-gray-400">• {g}</span>
             ))}
           </div>
        </div>
      )}
      
      {/* Mobile Title Overlay (Sempre visível no rodapé do card no mobile) */}
      <div className="md:hidden absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-2 pt-8">
        <p className="text-xs text-white font-medium text-center truncate">{content.title}</p>
      </div>
    </div>
  );
};

export default ContentCard;