import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL inválida' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) throw new Error(`Falha: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMeta = (props: string[]) => {
      for (const prop of props) {
        const val = $(`meta[property="${prop}"]`).attr('content') || 
                    $(`meta[name="${prop}"]`).attr('content');
        if (val) return val;
      }
      return null;
    };

    const productData = {
      title: getMeta(['og:title', 'twitter:title']) || $('h1').first().text().trim() || $('title').text().trim(),
      image: getMeta(['og:image', 'twitter:image', 'image:src']),
      description: getMeta(['og:description', 'description']),
      price: getMeta(['product:price:amount']) || 
             $('.andes-money-amount__fraction').first().text() || 
             $('span[class*="price"]').first().text().replace(/[^\d.,]/g, ''),
      url: url
    };

    return res.status(200).json(productData);
  } catch (error: any) {
    return res.status(500).json({ error: 'O site não permitiu a leitura automática.' });
  }
}
