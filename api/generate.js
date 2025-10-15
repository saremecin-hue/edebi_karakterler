export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    const finalPrompt = prompt || "Karakterler arasında yaklaşık 800 kelimelik diyalog oluştur";

    // DESTEKLENEN ENV İSİMLERİ (tercih sırasıyla)
    const OPENROUTER_KEY =
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_KEY ||
      process.env.API_KEY ||
      process.env.api_key ||
      process.env.OPENAI_API_KEY ||
      "";

    if (!OPENROUTER_KEY) {
      console.error("API anahtarı bulunamadı. Lütfen OPENROUTER_API_KEY veya api_key gibi env değişkenini ayarlayın.");
      return res.status(500).json({ error: "Sunucu yapılandırma hatası: API anahtarı yok." });
    }

    // Hangi env kullanıldıysa logla (Vercel logs'ta görünecek)
    const usedEnv = Object.keys(process.env).find(k => {
      const v = process.env[k];
      if (!v) return false;
      return v === OPENROUTER_KEY && ["OPENROUTER_API_KEY","OPENROUTER_KEY","API_KEY","api_key","OPENAI_API_KEY"].includes(k);
    }) || "unknown";
    console.log("Kullanılan API anahtarı env değişkeni:", usedEnv);

    const makeBody = (model) => ({
      model,
      messages: [
        { role: "system", content: "Sen edebiyat alanında uzman bir yazarsın." },
        { role: "user", content: finalPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.8
    });

    const modelToUse = process.env.OPENROUTER_MODEL || "mixtral-8x7b"; // fallback, /models endpoint'ine göre güncelleyin

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(makeBody(modelToUse)),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter hata yanıtı:", response.status, text);
      return res.status(response.status).json({ error: `API isteği başarısız: ${response.status}`, details: text });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || null;

    if (!content) {
      console.error("Modelden uygun içerik alınamadı:", JSON.stringify(data).slice(0,2000));
      return res.status(500).json({ error: "Modelden uygun içerik alınamadı." });
    }

    res.status(200).json({ text: content });
  } catch (error) {
    console.error("🔴 API Hatası:", error);
    res.status(500).json({ error: error?.message || "Sunucu hatası, metin oluşturulamadı." });
  }
}
