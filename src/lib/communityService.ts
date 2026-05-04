import { supabase } from './supabase';

export const communityService = {
  // Buscar posts com contagem de likes e dados do autor
  async getPosts() {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles (name, avatar_url),
        post_media (media_url, media_type),
        post_interactions (is_like)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Sistema de Like (Upsert)
  async toggleLike(postId: string, userId: string, isLike: boolean) {
    const { error } = await supabase
      .from('post_interactions')
      .upsert({ post_id: postId, user_id: userId, is_like: isLike });
    
    if (error) throw error;
  },

  // Upload de STL e Postagem
  async createPost(userId: string, title: string, description: string, stlFile: File, imageFiles: File[]) {
    // 1. Upload STL
    const stlName = `${userId}/${Date.now()}-${stlFile.name}`;
    const { data: stlData } = await supabase.storage.from('community-files').upload(stlName, stlFile);
    const stlUrl = supabase.storage.from('community-files').getPublicUrl(stlData!.path).data.publicUrl;

    // 2. Criar Post
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, title, description, stl_url: stlUrl })
      .select()
      .single();

    if (postError) throw postError;

    // 3. Upload Imagens e Vincular
    for (const file of imageFiles) {
      const imgName = `${post.id}/${Date.now()}-${file.name}`;
      const { data: imgData } = await supabase.storage.from('community-media').upload(imgName, file);
      const imgUrl = supabase.storage.from('community-media').getPublicUrl(imgData!.path).data.publicUrl;
      
      await supabase.from('post_media').insert({ post_id: post.id, media_url: imgUrl });
    }
  }
};
