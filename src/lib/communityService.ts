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

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    if (sortBy === 'views') query = query.order('views_count', { ascending: false });
    if (sortBy === 'likes') query = query.order('like_count', { ascending: false });

    const { data, error } = await query;
    if (error) return []; 
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

  // --- NOVA FUNÇÃO: CRIAR DÚVIDA NO FÓRUM ---
  async createDoubt(userId: string, title: string, content: string) {
    const { error } = await supabase
      .from('community_doubts')
      .insert({ user_id: userId, title, content });
    if (error) throw error;
  },

  async uploadFile(bucket: string, file: File, path: string) {
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async createPost(userId: string, title: string, description: string, stlFile: File, mediaFiles: File[]) {
    const stlExt = stlFile.name.split('.').pop();
    const stlPath = `${userId}/${Date.now()}_modelo.${stlExt}`;
    const stlUrl = await this.uploadFile('community_stls', stlFile, stlPath);

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, title, description, stl_url: stlUrl })
      .select().single();

    if (postError) throw postError;

    const mediaPromises = mediaFiles.map(async (file, index) => {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}_media_${index}.${ext}`;
      const url = await this.uploadFile('community_images', file, path);
      return { post_id: post.id, media_url: url };
    });

    const mediaData = await Promise.all(mediaPromises);
    if (mediaData.length > 0) {
      await supabase.from('post_media').insert(mediaData);
    }
    return post;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) throw error;
  },

  async incrementViews(postId: string, currentViews: number) {
    await supabase.from('community_posts').update({ views_count: currentViews + 1 }).eq('id', postId);
  },

  // --- INTERAÇÕES INTELIGENTES (Tirar voto / Trocar voto) ---
  async interactWithPost(postId: string, userId: string, isLike: boolean | null) {
    if (isLike === null) {
      // Remover interação se o usuário clicou no mesmo botão
      await supabase.from('post_interactions').delete().match({ post_id: postId, user_id: userId });
    } else {
      // Inserir ou atualizar (Upsert)
      await supabase.from('post_interactions').upsert({ post_id: postId, user_id: userId, is_like: isLike }, { onConflict: 'post_id,user_id' });
    }

    const { data: interactions } = await supabase.from('post_interactions').select('is_like').eq('post_id', postId);
    const likes = interactions?.filter(i => i.is_like === true).length || 0;
    const dislikes = interactions?.filter(i => i.is_like === false).length || 0;

    await supabase.from('community_posts').update({ like_count: likes, dislike_count: dislikes }).eq('id', postId);
  },

  // --- COMENTÁRIOS ---
  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, profiles:user_id(name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return data;
  },

  async addComment(postId: string, userId: string, content: string) {
    const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, content });
    if (error) throw error;
  }, // <--- A CHAVE E A VÍRGULA QUE FALTAVAM ESTÃO AQUI!

  // --- NOVAS FUNÇÕES DO FÓRUM ---
  async getDoubtComments(doubtId: string) {
    const { data, error } = await supabase
      .from('community_doubt_comments')
      .select('*, profiles:user_id(name)')
      .eq('doubt_id', doubtId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return data;
  },

  async addDoubtComment(doubtId: string, userId: string, content: string) {
    const { error } = await supabase.from('community_doubt_comments').insert({ doubt_id: doubtId, user_id: userId, content });
    if (error) throw error;
  },

  async deleteDoubt(doubtId: string) {
    const { error } = await supabase.from('community_doubts').delete().eq('id', doubtId);
    if (error) throw error;
  }
};
