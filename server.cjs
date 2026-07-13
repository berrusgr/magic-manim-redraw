const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
// Yüksek çözünürlüklü görseller gelebileceği için limit arttırıldı
app.use(express.json({ limit: '50mb' }));

app.post('/api/analyze', async (req, res) => {
  try {
    const { screenshotUrl } = req.body;
    if (!screenshotUrl) {
      return res.status(400).json({ error: 'screenshotUrl is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // parse base64 data
    const base64Data = screenshotUrl.split(',')[1];
    const mimeType = screenshotUrl.split(',')[0].split(':')[1].split(';')[0];

    const prompt = `Sen bir ManimJS uzmanısın. Ekteki görseldeki matematiksel fonksiyon grafiğini (veya elle çizilmiş bir fonksiyonu) incele. 
Bu fonksiyonu "manim-web" kütüphanesi kullanarak çizen JavaScript kodunu yaz. 

Kurallar ve API Bilgisi:
1. Sadece JavaScript kodu döndür. Markdown etiketleri (\`\`\`javascript vs) OLMASIN.
2. Objeler eval bağlamından (global olarak) gelir. Import kelimesini kullanma.
3. Kütüphanedeki API İmzaları (Yalnızca aşağıdaki imzalara uyulmalıdır, uydurma metod/sınıf kullanma):
   - NumberPlane:
     const axes = new NumberPlane({ xRange: [min, max, step], yRange: [min, max, step], xLength: 10, yLength: 6, backgroundLineStyle: { strokeColor: '#334155', strokeWidth: 1 } });
     Metodlar: axes.c2p(x, y) -> Koordinat düzlemindeki x,y noktasını sahnedeki 3D noktaya çevirir.
   - FunctionGraph:
     const graph = new FunctionGraph({ func: (x) => number, axes: axes, color: '#10b981', xRange: [min, max] });
     ÖNEMLİ: Grafik çizerken "applyTransform(plane.c2p)" diye bir metod YOKTUR! axes parametresi verilince kendisi otomatik çizilir.
   - Text veya MathTex:
     const title = new Text({ weight: 'bold', text: "...", color: '#ffffff' });
     Metodlar: title.scale(0.8); title.moveTo([x, y, z]); title.nextTo(dot, [dx, dy, dz], buff);
   - Dot:
     const dot = new Dot({ point: axes.c2p(x, y), color: '#ef4444' });
   - DashedLine:
     const line = new DashedLine({ start: axes.c2p(x1, y1), end: axes.c2p(x2, y2), color: '#9ca3af' });
   - Line:
     const line = new Line({ start: axes.c2p(x1, y1), end: axes.c2p(x2, y2), color: '#ff0000' });
   - Renkler her zaman hex string olmalıdır (örn: '#ff0000'). Color.RED gibi sınıflar YOKTUR.
4. Örnek Çizim Yapısı (Tanjant grafiği için asimptotları bölerek çizme örneği):
   \`\`\`
   const scene = await getScene();
   const axes = new NumberPlane({ xRange: [-7, 7, 1], yRange: [-4, 4, 1], xLength: 10, yLength: 6, backgroundLineStyle: { strokeColor: '#334155', strokeWidth: 1 } });
   
   // Eksenleri sahneye ekle ve oynat
   scene.add(axes);
   await scene.play(new Create(axes, { runTime: 1 }));

   // Grafik parçalarını oluştur (Tanjant tanımsız noktalardan kaçınmak için bölündü)
   const graph1 = new FunctionGraph({ func: (x) => Math.tan(x), axes: axes, color: '#f43f5e', xRange: [-1.5, 1.5] });
   const graph2 = new FunctionGraph({ func: (x) => Math.tan(x), axes: axes, color: '#f43f5e', xRange: [1.7, 4.5] });
   const graph3 = new FunctionGraph({ func: (x) => Math.tan(x), axes: axes, color: '#f43f5e', xRange: [-4.5, -1.7] });

   // Çizimleri sahneye oynatarak ekle
   await scene.play(new Create(graph1, { runTime: 1 }), new Create(graph2, { runTime: 1 }), new Create(graph3, { runTime: 1 }));

   // Dikey Asimptotları çiz
   const asim1 = new DashedLine({ start: axes.c2p(Math.PI/2, -4), end: axes.c2p(Math.PI/2, 4), color: '#9ca3af' });
   const asim2 = new DashedLine({ start: axes.c2p(-Math.PI/2, -4), end: axes.c2p(-Math.PI/2, 4), color: '#9ca3af' });
   await scene.play(new Create(asim1), new Create(asim2));
   \`\`\`
5. Sonuç sadece ve sadece kurallara uygun JAVASCRIPT olsun. Derleme hatalarından kaçın.`;

    let response;
    let attempts = 0;
    while (attempts < 3) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: prompt }
              ]
            }
          ]
        });
        break; // If successful, break out of loop
      } catch (err) {
        attempts++;
        if (err.status === 503 && attempts < 3) {
          console.warn(`503 High Demand, retrying in ${attempts * 2} seconds...`);
          await new Promise(res => setTimeout(res, attempts * 2000));
        } else {
          throw err;
        }
      }
    }

    let generatedCode = response.text || '';
    if (generatedCode.includes('```')) {
      const match = generatedCode.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)```/);
      if (match) {
        generatedCode = match[1];
      } else {
        generatedCode = generatedCode.replace(/```/g, '');
      }
    }

    console.log('--- GENERATED CODE ---');
    console.log(generatedCode);
    console.log('----------------------');

    res.json({ code: generatedCode.trim() });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
