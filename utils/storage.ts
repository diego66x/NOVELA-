import { supabase } from '../lib/supabase';
import { UserProgress, CustomConfig, ContentConfig } from '../types';

// Identificador único do dispositivo para simular um usuário sem login
const getDeviceId = () => {
  let id = localStorage.getItem('streamflex_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('streamflex_device_id', id);
  }
  return id;
};

const DEVICE_ID = getDeviceId();

// Helper to check for missing table error (PGRST205)
const isMissingTable = (error: any) => {
  return error?.code === 'PGRST205' || (error?.message && error.message.includes('does not exist'));
};

// --- CUSTOM CONFIGS (GLOBAL) ---

export const saveCustomConfig = async (id: string, config: ContentConfig) => {
  const { data: current, error: fetchError } = await supabase
    .from('content_overrides')
    .select('*')
    .eq('content_id', id)
    .maybeSingle();

  // Fallback para LocalStorage se a tabela não existir
  if (fetchError && isMissingTable(fetchError)) {
    try {
      const localData = JSON.parse(localStorage.getItem('streamflex_configs') || '{}');
      const currentConfig = localData[id] || {};
      
      localData[id] = {
         ...currentConfig,
         ...config
      };
      localStorage.setItem('streamflex_configs', JSON.stringify(localData));
    } catch (e) {
      console.error("Erro no LocalStorage (fallback):", e);
    }
    return;
  }

  const payload = {
    content_id: id,
    title: config.title || current?.title,
    thumbnail_url: config.thumbnailUrl || current?.thumbnail_url,
    video_url: config.videoUrl || current?.video_url,
    episodes_config: {
        full_list: config.customEpisodes || current?.episodes_config?.full_list,
        metadata: {
            description: config.description,
            coverUrl: config.coverUrl,
            year: config.year,
            ageRating: config.ageRating,
            match: config.match,
            genres: config.genres,
            type: config.type // Salvando o tipo
        }
    },
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('content_overrides')
    .upsert(payload);

  if (error && !isMissingTable(error)) {
    console.error('Erro ao salvar config:', JSON.stringify(error, null, 2));
  }
};

export const fetchCustomConfigs = async (): Promise<CustomConfig> => {
  const { data, error } = await supabase
    .from('content_overrides')
    .select('*');

  if (error) {
    if (isMissingTable(error)) {
      console.warn("Tabelas Supabase não encontradas. Usando LocalStorage.");
      try {
          const localData = JSON.parse(localStorage.getItem('streamflex_configs') || '{}');
          return localData;
      } catch { return {}; }
    }
    console.error('Erro ao buscar configs:', JSON.stringify(error, null, 2));
    return {};
  }
  
  if (!data) return {};

  const configs: CustomConfig = {};
  data.forEach((row: any) => {
    const eps = row.episodes_config?.full_list || undefined;
    const meta = row.episodes_config?.metadata || {};
    
    configs[row.content_id] = {
      title: row.title,
      thumbnailUrl: row.thumbnail_url,
      videoUrl: row.video_url,
      customEpisodes: eps,
      description: meta.description,
      coverUrl: meta.coverUrl,
      year: meta.year,
      ageRating: meta.ageRating,
      match: meta.match,
      genres: meta.genres,
      type: meta.type // Recuperando o tipo
    };
  });
  return configs;
};

// --- PROGRESS (USER SPECIFIC) ---

export const saveProgress = async (contentId: string, timestamp: number, episodeId?: string) => {
  const payload = { timestamp, lastUpdated: Date.now(), episodeId };
  
  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: DEVICE_ID,
      content_id: contentId,
      data_type: 'progress',
      payload: payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,content_id,data_type' });

    if (error) {
      if (isMissingTable(error)) {
        const localProgress = JSON.parse(localStorage.getItem('streamflex_progress') || '{}');
        localProgress[contentId] = payload;
        localStorage.setItem('streamflex_progress', JSON.stringify(localProgress));
      } else {
        console.error("Erro ao salvar progresso:", JSON.stringify(error, null, 2));
      }
    }
};

export const fetchUserProgress = async (): Promise<UserProgress> => {
  const { data, error } = await supabase
    .from('user_data')
    .select('content_id, payload')
    .eq('user_id', DEVICE_ID)
    .eq('data_type', 'progress');

  if (error) {
    if (isMissingTable(error)) {
      return JSON.parse(localStorage.getItem('streamflex_progress') || '{}');
    }
    console.error('Erro ao buscar progresso:', JSON.stringify(error, null, 2));
    return {};
  }
  
  if (!data) return {};

  const progress: UserProgress = {};
  data.forEach((row: any) => {
    progress[row.content_id] = row.payload;
  });
  return progress;
};

// --- FAVORITES (USER SPECIFIC) ---

export const toggleFavorite = async (id: string, currentFavorites: string[]) => {
  const isFavorite = currentFavorites.includes(id);
  let newFavs = isFavorite ? currentFavorites.filter(f => f !== id) : [...currentFavorites, id];

  if (isFavorite) {
    // Remove
    const { error } = await supabase
      .from('user_data')
      .delete()
      .eq('user_id', DEVICE_ID)
      .eq('content_id', id)
      .eq('data_type', 'favorite');
      
    if (error) {
      if (isMissingTable(error)) {
        localStorage.setItem('streamflex_favorites', JSON.stringify(newFavs));
      } else {
        console.error("Erro ao remover favorito:", JSON.stringify(error, null, 2));
      }
    }
  } else {
    // Add
    const { error } = await supabase
      .from('user_data')
      .insert({
        user_id: DEVICE_ID,
        content_id: id,
        data_type: 'favorite',
        payload: {},
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      if (isMissingTable(error)) {
        localStorage.setItem('streamflex_favorites', JSON.stringify(newFavs));
      } else {
        console.error("Erro ao adicionar favorito:", JSON.stringify(error, null, 2));
      }
    }
  }
  return newFavs;
};

export const fetchFavorites = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_data')
    .select('content_id')
    .eq('user_id', DEVICE_ID)
    .eq('data_type', 'favorite');

  if (error) {
    if (isMissingTable(error)) {
      return JSON.parse(localStorage.getItem('streamflex_favorites') || '[]');
    }
    console.error("Erro ao buscar favoritos:", JSON.stringify(error, null, 2));
    return [];
  }
  if (!data) return [];
  return data.map((row: any) => row.content_id);
};

// --- UPLOAD IMAGE ---
export const uploadImage = async (file: File): Promise<string | null> => {
  const fileName = `public/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, file);

  if (error) {
    console.error('Erro no upload:', JSON.stringify(error, null, 2));
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);
    
  return publicUrl;
};
