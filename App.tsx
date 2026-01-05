import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import ContentRow from './components/ContentRow';
import ContentCard from './components/ContentCard';
import DetailsModal from './components/DetailsModal';
import EditModal from './components/EditModal';
import VideoPlayer from './components/VideoPlayer';
import { Content, Episode, ContentConfig, UserProgress } from './types';
import { 
  fetchCustomConfigs, 
  saveCustomConfig, 
  fetchFavorites, 
  toggleFavorite, 
  fetchUserProgress 
} from './utils/storage';

const normalizeVideoUrl = (url: string | undefined) => {
  if (!url) return '';
  let cleanUrl = url.trim();
  try {
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&modestbranding=1&rel=0&playsinline=1&controls=1`;
    }
    if (cleanUrl.includes('drive.google.com')) {
      if (cleanUrl.includes('/preview')) return cleanUrl;
      const idMatch = cleanUrl.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
      }
    }
    if (cleanUrl.includes('dropbox.com')) {
      return cleanUrl.replace(/https:\/\/(www\.)?dropbox\.com/, 'https://dl.dropboxusercontent.com');
    }
  } catch (e) {
    console.error("Error normalizing URL:", e);
  }
  return cleanUrl;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');
  const [contents, setContents] = useState<Content[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [contentToEdit, setContentToEdit] = useState<Content | null>(null);
  const [playingConfig, setPlayingConfig] = useState<{ url: string; contentId: string; episodeId?: string; title: string; subTitle?: string, startTime?: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [favs, customConfigs, progress] = await Promise.all([
          fetchFavorites(),
          fetchCustomConfigs(),
          fetchUserProgress()
        ]);

        setFavorites(favs);
        setUserProgress(progress);

        // Reconstrói a lista de Conteúdos baseado no que está salvo no DB
        const parsedContents: Content[] = Object.entries(customConfigs).map(([id, config]) => ({
          id: id,
          title: config.title || 'Novo Conteúdo',
          description: config.description || '',
          thumbnailUrl: config.thumbnailUrl || 'https://via.placeholder.com/300x450?text=Capa',
          coverUrl: config.coverUrl || 'https://via.placeholder.com/1200x600?text=Banner',
          type: config.type || 'filmes',
          match: config.match || 0,
          year: config.year || new Date().getFullYear(),
          ageRating: config.ageRating || 'L',
          genres: config.genres || [],
          videoUrl: config.videoUrl,
          episodes: config.customEpisodes || []
        }));

        setContents(parsedContents);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateNew = () => {
    const newId = `custom-${Date.now()}`;
    const newContent: Content = {
      id: newId,
      title: 'Novo Conteúdo',
      description: '',
      thumbnailUrl: '',
      coverUrl: '',
      type: 'filmes', // Padrão, será alterado no EditModal
      match: 90,
      year: 2024,
      ageRating: 'L',
      genres: [],
      episodes: []
    };
    setContentToEdit(newContent);
  };

  const handleContentClick = (content: Content) => {
    if (content.type === 'filmes') {
      if (content.videoUrl) {
         handlePlayMovie(content);
      } else {
         setSelectedContent(content);
      }
    } else {
      setSelectedContent(content);
    }
  };

  const handleEditClick = (content: Content) => {
    setSelectedContent(null);
    setContentToEdit(content);
  };

  const handleSaveEdit = async (id: string, config: ContentConfig) => {
    // Check if new or existing
    const exists = contents.find(c => c.id === id);
    
    if (exists) {
        setContents(prev => prev.map(c => {
          if (c.id === id) {
            return {
              ...c,
              thumbnailUrl: config.thumbnailUrl || c.thumbnailUrl,
              coverUrl: config.coverUrl || c.coverUrl,
              videoUrl: config.videoUrl || c.videoUrl,
              title: config.title || c.title,
              description: config.description || c.description,
              year: config.year || c.year,
              ageRating: config.ageRating || c.ageRating,
              match: config.match || c.match,
              genres: config.genres || c.genres,
              episodes: config.customEpisodes || c.episodes,
              type: config.type || c.type
            };
          }
          return c;
        }));
    } else {
        // Add new
        const newContent: Content = {
          id: id,
          title: config.title || 'Sem Título',
          description: config.description || '',
          thumbnailUrl: config.thumbnailUrl || '',
          coverUrl: config.coverUrl || '',
          type: config.type || 'filmes',
          match: config.match || 0,
          year: config.year || 2024,
          ageRating: config.ageRating || 'L',
          genres: config.genres || [],
          videoUrl: config.videoUrl,
          episodes: config.customEpisodes || []
        };
        setContents(prev => [newContent, ...prev]);
    }
    
    await saveCustomConfig(id, config);
  };

  const handleToggleFavorite = async (id: string) => {
    const isFav = favorites.includes(id);
    const newFavs = isFav ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    await toggleFavorite(id, favorites);
  };

  const handlePlayMovie = (content: Content) => {
    if (!content.videoUrl) return;
    const progress = userProgress[content.id]?.timestamp || 0;
    setPlayingConfig({
      url: normalizeVideoUrl(content.videoUrl),
      contentId: content.id,
      title: content.title,
      startTime: progress
    });
    setSelectedContent(null);
  };

  const handlePlayEpisode = (contentId: string, episode: Episode) => {
    const progress = userProgress[contentId];
    const start = (progress?.episodeId === episode.id) ? progress.timestamp : 0;
    setPlayingConfig({
      url: normalizeVideoUrl(episode.videoUrl),
      contentId: contentId, 
      episodeId: episode.id,
      title: episode.title,
      subTitle: selectedContent?.title,
      startTime: start
    });
    setSelectedContent(null);
  };

  const filteredContent = useMemo(() => {
    if (currentView === 'home') return contents;
    if (currentView === 'favoritos') return contents.filter(c => favorites.includes(c.id));
    return contents.filter(c => c.type === currentView);
  }, [currentView, contents, favorites]);

  const continueWatchingContent = useMemo(() => {
    return contents.filter(c => {
      const prog = userProgress[c.id];
      return prog && prog.timestamp > 10;
    }).sort((a, b) => {
       const tsA = userProgress[a.id]?.lastUpdated || 0;
       const tsB = userProgress[b.id]?.lastUpdated || 0;
       return tsB - tsA;
    });
  }, [contents, userProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans pb-12">
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView}
        isEditMode={isEditMode}
        toggleEditMode={() => setIsEditMode(!isEditMode)}
      />

      {!playingConfig && (
        <div className="pt-24 px-4 md:px-0">
          {/* Se a lista estiver vazia e estivermos na Home, mostramos o container vazio com o botão */}
          {contents.length === 0 && currentView === 'home' && (
             <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
                 <h2 className="text-2xl font-bold mb-4 text-gray-400">Sua biblioteca está vazia</h2>
                 <p className="text-gray-500 mb-8">Adicione filmes ou novelas para começar.</p>
                 <button 
                   onClick={handleCreateNew}
                   className="bg-red-600 px-6 py-3 rounded text-white font-bold hover:bg-red-700 transition"
                 >
                   + Adicionar Primeiro Item
                 </button>
             </div>
          )}

          {currentView === 'home' ? (
            <>
              {continueWatchingContent.length > 0 && (
                <ContentRow 
                  title="Continue Assistindo" 
                  contents={continueWatchingContent} 
                  favorites={favorites}
                  userProgress={userProgress}
                  isEditMode={isEditMode}
                  onContentClick={handleContentClick}
                  onEditClick={handleEditClick}
                  onToggleFavorite={handleToggleFavorite}
                  onAddContent={handleCreateNew}
                />
              )}
              {/* Sempre exibe a lista principal com o botão de adicionar */}
              <ContentRow 
                title="Minha Biblioteca" 
                contents={contents} 
                favorites={favorites}
                userProgress={userProgress}
                isEditMode={isEditMode}
                onContentClick={handleContentClick}
                onEditClick={handleEditClick}
                onToggleFavorite={handleToggleFavorite}
                onAddContent={handleCreateNew}
              />
            </>
          ) : currentView === 'favoritos' ? (
             <div className="px-4 md:px-12">
                <h2 className="text-2xl font-bold mb-6">Minha Lista</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredContent.map(c => (
                    <div key={c.id}>
                       <ContentCard 
                         content={c}
                         isEditMode={isEditMode}
                         onCardClick={() => handleContentClick(c)}
                         onEditClick={() => handleEditClick(c)}
                         isFavorite={true}
                         onToggleFavorite={() => handleToggleFavorite(c.id)}
                         progress={0} 
                       />
                    </div>
                  ))}
                </div>
             </div>
          ) : (
            <ContentRow 
              title={currentView === 'novelas' ? 'Novelas' : 'Filmes'} 
              contents={filteredContent} 
              favorites={favorites}
              userProgress={userProgress}
              isEditMode={isEditMode}
              onContentClick={handleContentClick}
              onEditClick={handleEditClick}
              onToggleFavorite={handleToggleFavorite}
              onAddContent={handleCreateNew}
            />
          )}
        </div>
      )}

      <DetailsModal 
        content={selectedContent} 
        onClose={() => setSelectedContent(null)}
        onPlayMovie={handlePlayMovie}
        onPlayEpisode={handlePlayEpisode}
        isEditMode={isEditMode}
        onEdit={() => selectedContent && handleEditClick(selectedContent)}
      />

      <EditModal 
        content={contentToEdit}
        onClose={() => setContentToEdit(null)}
        onSave={handleSaveEdit}
      />

      {playingConfig && (
        <VideoPlayer 
          videoUrl={playingConfig.url} 
          contentId={playingConfig.contentId}
          episodeId={playingConfig.episodeId}
          title={playingConfig.title}
          subTitle={playingConfig.subTitle}
          initialTime={playingConfig.startTime || 0}
          onClose={() => {
            fetchUserProgress().then(setUserProgress);
            setPlayingConfig(null);
          }}
        />
      )}
    </div>
  );
};

export default App;