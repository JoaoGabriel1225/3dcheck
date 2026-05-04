import { supabase } from '@/lib/supabase';

export const communityService = {
  async getPosts() {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id (name),
        post_media (media_url),
        post_interactions (is_like, user_id)
      `)
      .order('created_at', { ascending: false });
    
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
    
    if (error) {
      console.error("Erro Supabase (Dúvidas):", error.message);
      return [];
    }
    return data;
  }
};
