import { supabase } from '@/lib/supabase';

export const communityService = {
  async getPosts() {
    // Simplificamos o select para evitar conflitos de FK
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles (name, avatar_url),
        post_media (media_url),
        post_interactions (is_like, user_id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro posts:", error);
      return [];
    }
    return data;
  },

  async getDoubts() {
    const { data, error } = await supabase
      .from('community_doubts')
      .select('*, profiles(name, avatar_url)')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
  }
};
