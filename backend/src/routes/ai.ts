import { Router } from 'express';
import type { MarketHub } from '../market-hub.js';
import { answerQuestion } from '../ai/query-router.js';

/** Optional LLM rephrasing layer. Only runs if ANTHROPIC_API_KEY is set;
 * otherwise the rule-based answer from query-router.ts is returned
 * as-is (still 100% real data, just less conversational). The LLM is
 * given the already-fetched grounded data and told explicitly to
 * rephrase only, not invent numbers -- see the system prompt below. */
async function rephraseIfConfigured(question: string, groundedAnswer: string, groundedData: unknown): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return groundedAnswer;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system:
          'Sen Veri Terminali uygulamasının Türkçe konuşan veri asistanısın. Sana verilen gerçek veriyi (groundedData) daha akıcı bir cümleye dönüştür. ASLA yeni bir sayı, fiyat, tahmin veya yatırım tavsiyesi üretme -- yalnızca verilen veriyi yeniden ifade et. Kısa ve öz ol.',
        messages: [
          {
            role: 'user',
            content: `Soru: ${question}\n\nGerçek veriye dayalı taslak yanıt: ${groundedAnswer}\n\nHam veri: ${JSON.stringify(groundedData).slice(0, 2000)}`,
          },
        ],
      }),
    });
    if (!res.ok) return groundedAnswer;
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = data.content?.[0]?.text;
    return text?.trim() || groundedAnswer;
  } catch {
    return groundedAnswer;
  }
}

export function aiRouter(hub: MarketHub) {
  const router = Router();

  router.post('/ask', async (req, res) => {
    const question = String(req.body?.question ?? '').trim();
    if (!question) return res.status(400).json({ error: 'question is required' });

    const result = await answerQuestion(hub, question);
    const answer = await rephraseIfConfigured(question, result.answer, result.groundedData);
    res.json({ ...result, answer, llmPhrased: Boolean(process.env.ANTHROPIC_API_KEY) });
  });

  return router;
}
