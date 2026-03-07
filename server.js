import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

const CAT_SYSTEM = `너는 현명하고 약간 무뚝뚝하지만 따뜻한 고양이야.
사람들의 잡생각이나 고민을 들으면 짧고 솔직하게, 고양이스러운 말투로 평가하고 한마디 해줘.
딱 2-3문장으로 핵심만. 가끔 "~", "..." 같은 표현 자연스럽게 써도 좋아.
객관적이고 약간 비꼬는 듯하지만 결국엔 따뜻한 한마디를 해줘.
너무 형식적이지 않게, 진짜 고양이처럼 자연스럽게. 한국어로 답해.`;

// Fallback responses when no API key is available
const FALLBACK = [
  "솔직히 말하면 그건 네 머릿속에서만 크게 느껴지는 거야. 밖에서 보면 별거 아니거든. 물 한 잔 마시고 5분만 다른 거 해봐.",
  "그 고민... 내일도 기억이나 할 것 같아? 한 달 뒤엔? 아마 아닐걸. 지금 당장 해결 못해도 어떻게든 되더라고.",
  "완벽하게 준비된 다음에 시작하려고 기다리는 거잖아. 근데 완벽한 때는 안 와. 그냥 지금 시작하는 게 제일 완벽한 타이밍이야.",
  "남들이 어떻게 볼까 걱정하는 거 맞지? 근데 다들 자기 생각하느라 바빠서 너 생각할 틈이 없어.",
  "그게 네 잘못인지 아닌지 따지는 것보단, 지금 뭘 할 수 있는지 생각하는 게 더 유용해. 과거는 못 바꾸니까.",
  "불안하다고 결과가 바뀌진 않거든. 할 수 있는 것만 하고 나머지는 흘려보내.",
  "너무 많이 생각한 것 같아. 생각을 더 해봤자 답이 안 나올 때가 있거든. 일단 자고 내일 다시 봐.",
  "그 걱정의 80%는 실제로 일어나지 않아. 진짜 문제가 생기면 그때 가서 해결하면 돼.",
  "그거 네 통제 밖의 일이잖아. 통제 못 하는 걸 걱정해봤자 에너지 낭비야. 네가 바꿀 수 있는 것에만 집중해.",
  "피곤해 보여. 지금 당장 해결하려 하지 말고 좀 쉬어. 쉬는 것도 전략이야.",
];

function streamFallback(res) {
  const text = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  let i = 0;
  const iv = setInterval(() => {
    if (i < text.length) {
      res.write(`data: ${JSON.stringify({ text: text[i++] })}\n\n`);
    } else {
      clearInterval(iv);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }, 28);
}

app.post('/api/advice', async (req, res) => {
  const { worry } = req.body;
  if (!worry?.trim()) return res.status(400).json({ error: '고민을 적어줘!' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!genAI) return streamFallback(res);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: CAT_SYSTEM,
    });

    const result = await model.generateContentStream(`고민: ${worry}`);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Gemini API error:', error.message);
    streamFallback(res);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const mode = genAI ? '✨ Gemini AI 연결됨' : '🐱 하드코딩 모드';
  console.log(`${mode} — http://localhost:${PORT}`);
});
