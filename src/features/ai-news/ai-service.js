import { mostrarToast } from '../../utils/utils.js'; // Ajusta o caminho

export async function generateNewsWithAI(fatos, tom, categoryLabel, signal) {
  if (!window.API_CONFIG || !API_CONFIG.GROQ_KEY) {
    mostrarToast('Erro: API Groq não configurada. Verifique api-config.js', 'erro');
    throw new Error('API Groq não configurada');
  }

  const prompt = `Você é um jornalista de agronegócio. Responda APENAS com um JSON puro:
  { "titulo": "...", "subtitulo": "...", "corpo": "...", "tempo_leitura": "..." }
  Fatos: ${fatos} (Tom: ${tom}, Cat: ${categoryLabel})`;

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.GROQ_KEY}`
      },
      body: JSON.stringify({
        model: API_CONFIG.MODEL,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: signal // Pass the AbortSignal here
    });

    if (!resp.ok) {
      const errorData = await resp.json();
      throw new Error(`Erro na API Groq: ${resp.status} - ${errorData.error?.message || resp.statusText}`);
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || '';

    const clean = raw.replace(/```json|```/g, '').trim();
    const noticia = JSON.parse(clean);
    
    if (!noticia.titulo || !noticia.corpo) {
      throw new Error("Resposta da IA incompleta ou em formato inválido.");
    }
    return noticia;

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Geração de notícia com IA abortada.');
    } else {
      mostrarToast(`Falha ao gerar notícia com IA: ${err.message}`, 'erro');
      console.error("Erro na chamada da API Groq:", err);
    }
    throw err; // Re-throw para que a função chamadora possa lidar com o erro
  }
}