import { supabase } from '@/lib/supabase'; // Alterado para usar o alias global @

export const communityService = {
  // Buscar todos os posts com dados do autor e mídias
  async getPosts() {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id (name, avatar_url, plan_status),
        post_media (*),
        post_interactions (is_like, user_id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Buscar dúvidas do fórum
  async getDoubts() {
    const { data, error } = await supabase
      .from('community_doubts')
      .select(`*, profiles:user_id (name, avatar_url)`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Alternar Like/Dislike
  async toggleLike(postId: string, userId: string, isLike: boolean) {
    const { error } = await supabase
      .from('post_interactions')
      .upsert({ post_id: postId, user_id: userId, is_like: isLike }, { onConflict: 'post_id,user_id' });
    
    if (error) throw error;
  },

  // Incrementar contador de downloads
  async incrementDownload(postId: string, currentCount: number) {
    await supabase
      .from('community_posts')
      .update({ download_count: currentCount + 1 })
      .eq('id', postId);
  }
};
