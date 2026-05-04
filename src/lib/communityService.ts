import { supabase } from '@/lib/supabase';

export const communityService = {
  async getPosts() {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id (name, avatar_url, plan_status),
        post_media (media_url),
        post_interactions (is_like, user_id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro na busca de posts:", error);
      throw error;
    }
    return data;
  },

  async getDoubts() {
    const { data, error } = await supabase
      .from('community_doubts')
      .select('*, profiles:user_id (name, avatar_url)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
