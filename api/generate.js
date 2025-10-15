export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, tema } = req.body || {};
    // Eğer frontend sadece 'tema' gönderiyorsa prompt oluştur
    const userPrompt = prompt || (tema ? `Tema: ${tema}\nKarakterler arasında özgün bir diyalog oluştur.` : "Karakterler arasında yaklaşık 800 kelimelik özgün bir diyalog oluştur.");

    // Desteklenen environment isimleri (öncelik sırasıyla)
    const API_KEY =
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_KEY ||
      process.env.API_KEY ||
      process.env.api_key ||
      process.env.OPENAI_API_KEY ||
      "";

    if (!API_KEY) {
      console.error("API anahtarı bulunamadı. Lütfen OPENROUTER_API_KEY veya api_key gibi bir env değişkeni ayarlayın.");
      return res.status(500).json({ error: "Sunucu yapılandırma hatası: API anahtarı yok." });
    }

    // Tercih edilen model (env ile ayarlayabilirsiniz). Eğer yoksa fallback mekanizması çalışacak.
    const preferredModel = process.env.OPENROUTER_MODEL || "";

    // İstek gövdesi yapılayıcısı
    const makeBody = (model) => ({
      model,
      messages: [
        { role: "system", content: "Sen edebiyat alanında uzman bir yazarsın." },
        { role: "user", content: userPrompt }
      ],
      // Tekrar: çok yüksek max_tokens modellerin reddetmesine neden olabilir. Önce 800-1200 deneyin.
      max_tokens: 1200,
      temperature: 0.8
    });

    // OpenRouter çağırma yardımcı fonksiyonu (raw response döner)
    const callOpenRouterRaw = async (body) => {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const rawText = await resp.text().catch(() => "");
      return { resp, rawText };
    };

    // 1) Eğer preferredModel belirtilmişse önce onu dene
    if (preferredModel) {
      console.log("Denenecek preferred model:", preferredModel);
      const { resp, rawText } = await callOpenRouterRaw(makeBody(preferredModel));
      console.error("OpenRouter raw response (preferred):", resp.status, rawText.slice(0, 2000));
      if (resp.ok) {
        let data;
        try { data = JSON.parse(rawText); } catch (e) { data = null; }
        const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || null;
        if (content) return res.status(200).json({ text: content });
        return res.status(500).json({ error: "Model başarılı ama içerik alınamadı.", details: rawText.slice(0,2000) });
      } else {
        // Eğer hata model ID ile ilgiliyse, fallback'a geç; değilse direkt döndür
        if (!(resp.status === 400 && rawText.toLowerCase().includes("not a valid model"))) {
          return res.status(resp.status).json({ error: `API isteği başarısız: ${resp.status}`, details: rawText.slice(0,2000) });
        }
        console.warn("Preferred model geçersiz görünüyor, fallback çalıştırılacak.");
      }
    }

    // 2) Preferred yoksa veya geçersizse /models endpoint'inden uygun bir model seç
    console.log("Models endpoint'inden kullanılabilir chat-uyumlu modeller alınıyor.");
    const modelsResp = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: { "Authorization": `Bearer ${API_KEY}` }
    });
    const modelsText = await modelsResp.text().catch(() => "");
    console.error("OpenRouter /models raw:", modelsResp.status, modelsText.slice(0,2000));
    let modelsJson;
    try { modelsJson = JSON.parse(modelsText); } catch (e) { modelsJson = null; }

    const list = (modelsJson?.data || modelsJson?.models || modelsJson || []);
    const candidates = (Array.isArray(list) ? list : Object.values(list || {}))
      .filter(Boolean)
      .filter(m => {
        const caps = m.capabilities || [];
        const type = (m.type || "").toLowerCase();
        // Chat-uyumlu modeli tespit et (type veya capabilities'de chat olan)
        return type.includes("chat") || (Array.isArray(caps) && caps.includes("chat"));
      });

    if (!candidates || candidates.length === 0) {
      console.error("Hesabınızda chat-uyumlu model bulunamadı. Models raw (kısa):", modelsText.slice(0,2000));
      return res.status(500).json({ error: "Hesabınızda chat-uyumlu model bulunamadı.", details: modelsText.slice(0,2000) });
    }

    // Öncelikli tercih: eğer listede açıkça ':free' etiketli model varsa onu öncelikle dene (ör. alibaba/...:free)
    let pick = candidates.find(c => String(c.id || c.name || "").toLowerCase().includes(":free"));
    if (!pick) pick = candidates[0];
    const modelId = pick.id || pick.name || pick;

    console.log("Fallback model seçildi:", modelId);

    // 3) Seçilen model ile isteği tekrar gönder
    const { resp: resp2, rawText: raw2 } = await callOpenRouterRaw(makeBody(modelId));
    console.error("OpenRouter raw response (fallback):", resp2.status, raw2.slice(0,2000));
    if (!resp2.ok) {
      return res.status(resp2.status).json({ error: `API isteği başarısız: ${resp2.status}`, details: raw2.slice(0,2000) });
    }
    let data2;
    try { data2 = JSON.parse(raw2); } catch (e) { data2 = null; }
    const content2 = data2?.choices?.[0]?.message?.content || data2?.choices?.[0]?.text || null;
    if (!content2) {
      console.error("Fallback modelden içerik alınamadı:", JSON.stringify(data2).slice(0,2000));
      return res.status(500).json({ error: "Modelden uygun içerik alınamadı.", details: JSON.stringify(data2).slice(0,2000) });
    }

    return res.status(200).json({ text: content2 });

  } catch (error) {
    console.error("🔴 API Hatası (handler):", error);
    return res.status(500).json({ error: error?.message || "Sunucu hatası, metin oluşturulamadı." });
  }
}
