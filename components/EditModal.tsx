import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Plus, Trash2, Film, Tv } from 'lucide-react';
import { Content, ContentConfig, Episode, Category } from '../types';
import { uploadImage } from '../utils/storage';

interface EditModalProps {
  content: Content | null;
  onClose: () => void;
  onSave: (id: string, config: ContentConfig) => void;
}

const EditModal: React.FC<EditModalProps> = ({ content, onClose, onSave }) => {
  // Campos Básicos
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState(''); // Capa de fundo
  const [videoUrl, setVideoUrl] = useState('');
  const [type, setType] = useState<Category>('filmes'); // Novo
  
  // Campos de Metadados
  const [description, setDescription] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [ageRating, setAgeRating] = useState('14');
  const [match, setMatch] = useState(98);
  const [genres, setGenres] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  
  // Lista de episódios editável
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setThumbnailUrl(content.thumbnailUrl);
      setCoverUrl(content.coverUrl);
      setVideoUrl(content.videoUrl || '');
      setType(content.type);
      
      setDescription(content.description);
      setYear(content.year);
      setAgeRating(content.ageRating);
      setMatch(content.match);
      setGenres(content.genres.join(', '));
      
      // Carregar episódios existentes ou iniciar lista vazia
      if (content.episodes) {
        setEpisodesList(content.episodes);
      } else {
        setEpisodesList([]);
      }
    }
  }, [content]);

  if (!content) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'thumb' | 'cover' | 'epThumb', epIndex?: number) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const url = await uploadImage(e.target.files[0]);
        if (url) {
          if (target === 'thumb') setThumbnailUrl(url);
          else if (target === 'cover') setCoverUrl(url);
          else if (target === 'epThumb' && epIndex !== undefined) {
             handleUpdateEpisode(epIndex, 'thumbnail', url);
          }
        } else {
          alert('Erro ao fazer upload. Verifique as configurações.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddEpisode = () => {
    // Se estiver em filmes, muda para novelas automaticamente ao adicionar episódio
    if (type === 'filmes') {
      setType('novelas');
    }

    const newEp: Episode = {
      id: `custom-ep-${Date.now()}`,
      title: `Episódio ${episodesList.length + 1}`,
      description: 'Sinopse do episódio...',
      videoUrl: '',
      thumbnail: thumbnailUrl || coverUrl || 'https://via.placeholder.com/300x170', 
      duration: 0
    };
    setEpisodesList([...episodesList, newEp]);
  };

  const handleRemoveEpisode = (index: number) => {
    const newList = [...episodesList];
    newList.splice(index, 1);
    setEpisodesList(newList);
  };

  const handleUpdateEpisode = (index: number, field: keyof Episode, value: any) => {
    const newList = [...episodesList];
    newList[index] = { ...newList[index], [field]: value };
    setEpisodesList(newList);
  };

  const handleSave = () => {
    const config: ContentConfig = {
      title: title || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      coverUrl: coverUrl || undefined,
      description: description || undefined,
      year: Number(year),
      ageRating: ageRating,
      match: Number(match),
      genres: genres.split(',').map(g => g.trim()).filter(g => g),
      type: type
    };

    if (type === 'filmes' && videoUrl) {
      config.videoUrl = videoUrl;
    }

    // Sempre salva episódios se a lista não estiver vazia, ou se não for filme
    if (episodesList.length > 0 || type !== 'filmes') {
      config.customEpisodes = episodesList;
    }

    onSave(content.id, config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#181818] w-full max-w-4xl rounded-lg shadow-2xl border border-gray-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
          <h2 className="text-xl font-bold text-white">
             {title === 'Novo Conteúdo' ? 'Adicionar Novo' : 'Editar Conteúdo'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          <div className="grid md:grid-cols-2 gap-6">
             {/* Left Column: Visuals & Main Info */}
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Título Principal</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#333] border border-gray-600 focus:border-white text-white rounded p-2 outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-300 mb-1">Categoria (Tipo)</label>
                   <div className="grid grid-cols-3 gap-2">
                      {(['filmes', 'novelas', 'series'] as Category[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setType(cat)}
                          className={`p-2 rounded text-sm font-bold border transition-colors ${
                            type === cat 
                            ? 'bg-white text-black border-white' 
                            : 'bg-[#333] text-gray-400 border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {cat === 'filmes' ? 'Filme' : cat === 'novelas' ? 'Novela' : 'Série'}
                        </button>
                      ))}
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Sinopse (Descrição)</label>
                  <textarea 
                    className="w-full bg-[#333] border border-gray-600 focus:border-white text-white rounded p-2 outline-none h-32 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Capa Pequena (Poster)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 bg-[#333] border border-gray-600 rounded p-1 text-xs text-white"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                      />
                      <label className="bg-gray-700 text-white px-2 rounded flex items-center cursor-pointer hover:bg-gray-600">
                        <Upload size={14} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumb')} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Capa de Fundo (Hero)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 bg-[#333] border border-gray-600 rounded p-1 text-xs text-white"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                      />
                      <label className="bg-gray-700 text-white px-2 rounded flex items-center cursor-pointer hover:bg-gray-600">
                        <Upload size={14} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Video URL for Movies */}
                {type === 'filmes' && (
                  <div className="p-4 bg-blue-900/20 border border-blue-900 rounded">
                    <label className="block text-sm font-bold text-blue-200 mb-1 flex items-center gap-2">
                       <Film size={16} /> Link do Filme (Arquivo Único)
                    </label>
                    <input 
                      type="url" 
                      className="w-full bg-[#333] border border-gray-600 focus:border-white text-white rounded p-2 outline-none"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}
             </div>

             {/* Right Column: Metadata */}
             <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Ano</label>
                      <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full bg-[#333] border border-gray-600 text-white rounded p-2 text-sm" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Idade (+)</label>
                      <input type="text" value={ageRating} onChange={(e) => setAgeRating(e.target.value)} className="w-full bg-[#333] border border-gray-600 text-white rounded p-2 text-sm" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Match (%)</label>
                      <input type="number" value={match} onChange={(e) => setMatch(Number(e.target.value))} className="w-full bg-[#333] border border-gray-600 text-white rounded p-2 text-sm" />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-300 mb-1">Gêneros (separados por vírgula)</label>
                   <input 
                      type="text" 
                      value={genres} 
                      onChange={(e) => setGenres(e.target.value)} 
                      className="w-full bg-[#333] border border-gray-600 text-white rounded p-2 outline-none"
                      placeholder="Drama, Ação, Suspense"
                   />
                </div>

                {/* Previews */}
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 mb-2">Previews:</p>
                  <div className="flex gap-4">
                    {thumbnailUrl && <img src={thumbnailUrl} className="w-20 h-32 object-cover rounded border border-gray-700" alt="Poster" />}
                    {coverUrl && <img src={coverUrl} className="w-48 h-28 object-cover rounded border border-gray-700" alt="Cover" />}
                  </div>
                </div>
             </div>
          </div>
          
          {/* Episodes Editor - Sempre Visível se tiver episódios ou se não for filme */}
          <div className="border-t border-gray-700 pt-6 mt-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Tv size={20} />
                    {type === 'filmes' ? 'Episódios (Requer Novela/Série)' : 'Gerenciar Episódios'}
                 </h3>
                 <button 
                    onClick={handleAddEpisode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold transition ${
                        type === 'filmes' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                 >
                   <Plus size={16} /> {type === 'filmes' ? 'Converter e Adicionar Episódio' : 'Adicionar Episódio'}
                 </button>
               </div>

               {type === 'filmes' && episodesList.length === 0 && (
                   <p className="text-gray-500 text-sm italic mb-4">
                       Este conteúdo está configurado como <strong>Filme</strong>. 
                       Clique no botão acima para adicionar episódios e mudar automaticamente para <strong>Novela/Série</strong>.
                   </p>
               )}

               <div className="space-y-4">
                 {episodesList.map((ep, index) => (
                   <div key={ep.id} className="bg-[#222] p-4 rounded border border-gray-800 flex flex-col gap-3 relative group">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-500 uppercase">Episódio {index + 1}</span>
                         <button 
                           onClick={() => handleRemoveEpisode(index)}
                           className="text-red-500 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-500/10 rounded"
                           title="Remover episódio"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Título</label>
                          <input
                            type="text"
                            value={ep.title}
                            onChange={(e) => handleUpdateEpisode(index, 'title', e.target.value)}
                            className="w-full bg-[#333] border border-transparent focus:border-gray-500 text-white rounded p-2 text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Link Vídeo</label>
                          <input
                            type="url"
                            value={ep.videoUrl}
                            onChange={(e) => handleUpdateEpisode(index, 'videoUrl', e.target.value)}
                            className="w-full bg-[#333] border border-transparent focus:border-gray-500 text-white rounded p-2 text-sm outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                         <div className="w-32 shrink-0">
                           <label className="block text-xs text-gray-400 mb-1">Thumbnail</label>
                           {/* Visual Preview / Upload Box */}
                           <div className="relative group/thumb cursor-pointer border border-gray-700 rounded overflow-hidden h-20 w-full bg-[#111] mb-1">
                              <img src={ep.thumbnail} className="w-full h-full object-cover" alt="thumb" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition">
                                 <Upload size={16} />
                              </div>
                              <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'epThumb', index)}
                              />
                           </div>
                           {/* URL Input Field */}
                           <input
                            type="text"
                            value={ep.thumbnail}
                            onChange={(e) => handleUpdateEpisode(index, 'thumbnail', e.target.value)}
                            className="w-full bg-[#333] border border-transparent focus:border-gray-500 text-white rounded p-1 text-[10px] outline-none"
                            placeholder="URL da imagem..."
                          />
                         </div>
                         <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Sinopse</label>
                            <textarea
                              value={ep.description}
                              onChange={(e) => handleUpdateEpisode(index, 'description', e.target.value)}
                              className="w-full bg-[#333] border border-transparent focus:border-gray-500 text-white rounded p-2 text-sm outline-none resize-none h-24"
                            />
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-3 shrink-0 bg-[#181818]">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-bold text-gray-300 hover:text-white transition"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isUploading}
            className="px-6 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition shadow-lg shadow-red-900/20"
          >
            <Save size={16} /> Salvar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;