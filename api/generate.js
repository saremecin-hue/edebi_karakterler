export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, tema } = req.body || {};
    const userPrompt = prompt || (tema ? `Tema: ${tema}\nKarakterler arasında özgün bir diyalog oluştur.` : "Karakterler arasında yaklaşık 800 kelimelik özgün bir diyalog oluştur.");

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

    const preferredModel = process.env.OPENROUTER_MODEL || "";

    // Heuristics: chat-uyumlu olduğunu düşündüğümüz anahtar kelimeler
    const chatKeywords = [
      "chat", "claude", "gpt", "qwen", "gemini", "mixtral", "tongyi",
      "llama", "grok", "anthropic", "openai", "qwen3", "deepresearch"
    ];

    const makeBody = (model) => ({
      model,
      messages: [
        { role: "system", content: "Sen edebiyat alanında uzman bir yazarsın." },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.8
    });

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

    // 1) Eğer preferredModel varsa önce onu dene
    if (preferredModel) {
      console.log("Denenecek preferred model:", preferredModel);
      const { resp, rawText } = await callOpenRouterRaw(makeBody(preferredModel));
      console.error("OpenRouter raw response (preferred):", resp.status, rawText.slice(0,2000));
      if (resp.ok) {
        let data;
        try { data = JSON.parse(rawText); } catch (e) { data = null; }
        const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || null;
        if (content) return res.status(200).json({ text: content });
        return res.status(500).json({ error: "Model başarılı ama içerik alınamadı.", details: rawText.slice(0,2000) });
      } else {
        if (!(resp.status === 400 && rawText.toLowerCase().includes("not a valid model"))) {
          return res.status(resp.status).json({ error: `API isteği başarısız: ${resp.status}`, details: rawText.slice(0,2000) });
        }
        console.warn("Preferred model geçersiz görünüyor, fallback çalıştırılacak.");
      }
    }

    // 2) /models endpoint'ini al
    const modelsResp = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: { "Authorization": `Bearer ${API_KEY}` }
    });
    const modelsText = await modelsResp.text().catch(() => "");
    console.error("OpenRouter /models raw (status " + modelsResp.status + "):", modelsText.slice(0,2000));
    let modelsJson;
    try { modelsJson = JSON.parse(modelsText); } catch (e) { modelsJson = null; }

    const list = (modelsJson?.data || modelsJson?.models || modelsJson || []);
    const arr = Array.isArray(list) ? list : Object.values(list || {});

    // Heuristics-based candidate selection
    const candidates = arr
      .filter(Boolean)
      .map(m => {
        // normalize fields
        const id = m.id || m.name || m.canonical_slug || (typeof m === "string" ? m : "");
        const desc = (m.description || m.summary || m.long_description || "").toString().toLowerCase();
        const type = (m.type || "").toString().toLowerCase();
        const caps = Array.isArray(m.capabilities) ? m.capabilities.map(x=>String(x).toLowerCase()) : [];
        const ctx = Number(m.context_length || m.max_context || m.context || 0) || 0;
        // score heuristics
        let score = 0;
        // exact capabilities/type mentions
        if (caps.includes("chat")) score += 50;
        if (type.includes("chat")) score += 40;
        // keyword match in id or slug or desc
        const idLower = String(id).toLowerCase();
        chatKeywords.forEach(k => { if (idLower.includes(k) || desc.includes(k) || type.includes(k)) score += 10; });
        // context length helps (larger context likely chat-capable)
        if (ctx >= 65536) score += 25;
        else if (ctx >= 16000) score += 15;
        else if (ctx >= 8000) score += 8;
        else if (ctx >= 4096) score += 4;
        // free tag preference
        if (idLower.includes(":free") || idLower.includes("free")) score += 20;
        return { raw: m, id, score, ctx, type, caps };
      })
      .filter(c => c.id) // remove empty ids
      .sort((a,b) => b.score - a.score);

    console.log("Candidates found (count):", candidates.length);
    console.log("Top candidates preview:", candidates.slice(0,8).map(c => ({ id: c.id, score: c.score, ctx: c.ctx })));

    if (!candidates || candidates.length === 0) {
      console.error("Heuristics ile de uygun model bulunamadı. Models raw (kısa):", modelsText.slice(0,2000));
      return res.status(500).json({ error: "Hesabınızda chat-uyumlu model bulunamadı.", details: modelsText.slice(0,2000) });
    }

    // seç: en yüksek score'lu model
    const modelId = candidates[0].id;
    console.log("Seçilen modelId:", modelId);

    // 3) seçilen model ile çağrı
    const { resp: resp2, rawText: raw2 } = await callOpenRouterRaw(makeBody(modelId));
    console.error("OpenRouter raw response (fallback):", resp2.status, raw2.slice(0,2000));
    if (!resp2.ok) {
      // döndürülen candidate listesi ile birlikte hatayı döndür (debug)
      return res.status(resp2.status).json({ error: `API isteği başarısız: ${resp2.status}`, details: raw2.slice(0,2000), candidates: candidates.slice(0,10).map(c=>({id:c.id,score:c.score})) });
    }
    let data2;
    try { data2 = JSON.parse(raw2); } catch (e) { data2 = null; }
    const content2 = data2?.choices?.[0]?.message?.content || data2?.choices?.[0]?.text || null;
    if (!content2) {
      console.error("Fallback modelden içerik alınamadı:", JSON.stringify(data2).slice(0,2000));
      return res.status(500).json({ error: "Modelden uygun içerik alınamadı.", details: JSON.stringify(data2).slice(0,2000), candidates: candidates.slice(0,10).map(c=>({id:c.id,score:c.score})) });
    }

    return res.status(200).json({ text: content2 });

  } catch (error) {
    console.error("🔴 API Hatası (handler):", error);
    return res.status(500).json({ error: error?.message || "Sunucu hatası, metin oluşturulamadı." });
  }
}
// 402 handling + optional fallback pseudocode
const { resp, rawText } = await callOpenRouterRaw(body);
if (!resp.ok) {
  if (resp.status === 402) {
    console.error("OpenRouter: insufficient credits:", rawText);
    // kullanıcıya net mesaj dön
    return res.status(402).json({
      error: "Sunucu hatası: hesabınızda yeterli kredi yok.",
      action: "OpenRouter hesabınıza kredi yükleyin: https://openrouter.ai/settings/credits"
    });
  }
  // diğer hata durumları...
}
