import React from 'react';
import { X, Play, Edit3 } from 'lucide-react';
import { Content, Episode } from '../types';

interface DetailsModalProps {
  content: Content | null;
  onClose: () => void;
  onPlayEpisode: (contentId: string, episode: Episode) => void;
  onPlayMovie: (content: Content) => void;
  isEditMode: boolean; // Novo prop
  onEdit: () => void; // Novo prop
}

const DetailsModal: React.FC<DetailsModalProps> = ({ content, onClose, onPlayEpisode, onPlayMovie, isEditMode, onEdit }) => {
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto animate-fade-in backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="relative w-full max-w-4xl bg-[#181818] rounded-lg shadow-2xl overflow-hidden animate-scale-up">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-[#181818] rounded-full flex items-center justify-center hover:bg-gray-700 transition"
          >
            <X className="text-white" />
          </button>

          {/* Banner */}
          <div className="relative h-64 md:h-96">
            <img 
              src={content.coverUrl} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent"></div>
            
            <div className="absolute bottom-6 left-6 md:left-12 max-w-xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{content.title}</h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-green-400 font-bold">{content.match}% de Match</span>
                <span className="text-gray-300">{content.year}</span>
                <span className="border border-gray-400 px-1 text-sm text-gray-300">{content.ageRating}</span>
              </div>
              
              <div className="flex items-center gap-3">
                  {content.type === 'filmes' && (
                    <button 
                      onClick={() => onPlayMovie(content)}
                      className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-opacity-90 flex items-center gap-2"
                    >
                      <Play fill="black" /> Assistir Filme
                    </button>
                  )}
                  
                  {isEditMode && (
                      <button 
                        onClick={onEdit}
                        className="bg-yellow-500 text-black px-6 py-3 rounded font-bold hover:bg-yellow-400 flex items-center gap-2"
                      >
                         <Edit3 size={18} /> Editar Info
                      </button>
                  )}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-12 flex flex-col md:flex-row gap-8">
            {/* Info */}
            <div className="flex-1 text-gray-300">
               <p className="text-lg leading-relaxed mb-6 whitespace-pre-line">{content.description}</p>
               <div className="space-y-1 text-sm">
                 <p><span className="text-gray-500">Gêneros:</span> {content.genres.join(', ')}</p>
                 <p><span className="text-gray-500">Tipo:</span> {content.type === 'novelas' ? 'Novela' : 'Filme'}</p>
               </div>
            </div>

            {/* Episodes List */}
            {content.episodes && (
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-4">Episódios</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {content.episodes.map((ep, idx) => (
                    <div 
                      key={ep.id}
                      className="flex gap-4 p-4 rounded hover:bg-[#2f2f2f] transition cursor-pointer group"
                      onClick={() => onPlayEpisode(content.id, ep)}
                    >
                      <div className="text-xl font-bold text-gray-500 w-6 flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div className="relative min-w-[120px] h-20 rounded overflow-hidden">
                        <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Play fill="white" size={24} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-baseline">
                            <h4 className="text-white font-bold text-sm">{ep.title}</h4>
                            <span className="text-xs text-gray-400">{Math.floor(ep.duration / 60)}m</span>
                         </div>
                         <p className="text-xs text-gray-400 mt-2 line-clamp-2">{ep.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
