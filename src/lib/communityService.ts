import { supabase } from '@/lib/supabase';

export const communityService = {
  // --- BUSCAR DADOS COM FILTROS ---
  async getPosts(sortBy: 'newest' | 'likes' | 'views' = 'newest') {
    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id (name, plan_status),
        post_media (media_url),
        post_interactions (is_like, user_id)
      `);

    // Aplica a ordenação escolhida na interface
    if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    if (sortBy === 'views') query = query.order('views_count', { ascending: false });
    if (sortBy === 'likes') query = query.order('like_count', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("Erro Supabase (Posts):", error.message);
      return []; 
    }
    return data;
  },

  async getDoubts() {
    const { data, error } = await supabase
      .from('community_doubts')
      .select('*, profiles:user_id (name)')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
  },

  // --- FUNÇÕES DE UPLOAD ---
  async uploadFile(bucket: string, file: File, path: string) {
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Agora aceita Múltiplas Imagens (Array de Files)
  async createPost(userId: string, title: string, description: string, stlFile: File, mediaFiles: File[]) {
    // 1. Upload do STL
    const stlExt = stlFile.name.split('.').pop();
    const stlPath = `${userId}/${Date.now()}_modelo.${stlExt}`;
    const stlUrl = await this.uploadFile('community_stls', stlFile, stlPath);

    // 2. Salva o Post
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, title, description, stl_url: stlUrl })
      .select().single();

    if (postError) throw postError;

    // 3. Upload de todas as imagens do Array (Até 5)
    const mediaPromises = mediaFiles.map(async (file, index) => {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}_media_${index}.${ext}`;
      const url = await this.uploadFile('community_images', file, path);
      return { post_id: post.id, media_url: url };
    });

    const mediaData = await Promise.all(mediaPromises);

    // 4. Salva os links das imagens no banco
    if (mediaData.length > 0) {
      const { error: mediaError } = await supabase.from('post_media').insert(mediaData);
      if (mediaError) throw mediaError;
    }

    return post;
  },

  // --- INTERAÇÕES E ADMINISTRAÇÃO ---
  async deletePost(postId: string) {
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) throw error;
  },

  async incrementViews(postId: string, currentViews: number) {
    const { error } = await supabase
      .from('community_posts')
      .update({ views_count: currentViews + 1 })
      .eq('id', postId);
    if (error) console.error("Erro ao computar visita");
  },
  
  async incrementDownload(postId: string, currentDownloads: number) {
    const { error } = await supabase
      .from('community_posts')
      .update({ download_count: currentDownloads + 1 })
      .eq('id', postId);
    if (error) console.error("Erro ao computar download");
  }
};
