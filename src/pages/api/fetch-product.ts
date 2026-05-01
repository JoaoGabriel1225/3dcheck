import type { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL inválida' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Captura os metadados (Título, Imagem, Descrição)
    const getMeta = (name: string) => 
      $(`meta[property="og:${name}"]`).attr('content') || 
      $(`meta[name="${name}"]`).attr('content') ||
      $(`meta[name="twitter:${name}"]`).attr('content');

    const productData = {
      title: getMeta('title') || $('title').text(),
      image: getMeta('image'),
      description: getMeta('description'),
      // Tenta buscar o preço em tags comuns de e-commerce
      price: $('meta[property="product:price:amount"]').attr('content') || 
             $('span[class*="price"]').first().text().replace(/[^\d.,]/g, '')
    };

    return res.status(200).json(productData);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao ler o site' });
  }
}
