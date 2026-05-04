import { supabase } from '@/lib/supabase';

export const communityService = {
  // --- BUSCAR DADOS ---
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
  },

  // --- UPLOAD DE ARQUIVOS ---
  async uploadFile(bucket: string, file: File, path: string) {
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    
    // Pega o link público gerado
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrlData.publicUrl;
  },

  // --- CRIAR NOVO POST ---
  async createPost(userId: string, title: string, description: string, stlFile: File, imageFile: File) {
    // 1. Gera nomes únicos para não dar conflito
    const stlExt = stlFile.name.split('.').pop();
    const imgExt = imageFile.name.split('.').pop();
    const stlPath = `${userId}/${Date.now()}_modelo.${stlExt}`;
    const imgPath = `${userId}/${Date.now()}_capa.${imgExt}`;

    // 2. Faz o Upload para os Buckets
    const stlUrl = await this.uploadFile('community_stls', stlFile, stlPath);
    const imgUrl = await this.uploadFile('community_images', imageFile, imgPath);

    // 3. Salva os textos no Banco de Dados
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, title, description, stl_url: stlUrl })
      .select()
      .single();

    if (postError) throw postError;

    // 4. Salva a Imagem no Banco de Dados vinculada ao Post
    const { error: mediaError } = await supabase
      .from('post_media')
      .insert({ post_id: post.id, media_url: imgUrl });

    if (mediaError) throw mediaError;

    return post;
  }
};
