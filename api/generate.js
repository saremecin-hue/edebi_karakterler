export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    const finalPrompt = prompt || "Karakterler arasında 2000 kelimelik diyalog oluştur";

    // ENV kontrolü
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY yok veya tanımlı değil.");
      return res.status(500).json({ error: "Sunucu yapılandırma hatası: API anahtarı yok." });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b",
        messages: [
          { role: "system", content: "Sen edebiyat alanında uzman bir yazarsın." },
          { role: "user", content: finalPrompt }
        ],
        // Modelin token limitine dikkat edin. Çok yüksek değerler reddedilebilir.
        max_tokens: 2000,
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      const text = await response.text(); // JSON değilse de yakala
      console.error("OpenRouter hata yanıtı:", response.status, text);
      // İstemciye daha açık hata dönebilirsiniz (prod'da hassas bilgi vermeyin)
      return res.status(response.status).json({ error: `API isteği başarısız: ${response.status}`, details: text });
    }

    const data = await response.json();

    // OpenRouter/Model schema'sını doğrula
    const content = (
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      null
    );

    if (!content) {
      console.error("OpenRouter beklenmeyen cevap formatı:", JSON.stringify(data));
      return res.status(500).json({ error: "Modelden uygun içerik alınamadı." });
    }

    res.status(200).json({ text: content });

  } catch (error) {
    console.error("🔴 API Hatası:", error);
    res.status(500).json({ error: error?.message || "Sunucu hatası, metin oluşturulamadı." });
  }
}
