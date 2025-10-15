// api/generate.js
// Değiştir: bu dosya Hugging Face Inference API'yi çağırır.
// Ortam değişkenleri: HUGGINGFACE_API_KEY, HUGGINGFACE_MODEL (opsiyonel)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { tema, prompt } = req.body || {};
    const userPrompt = prompt || (tema ? `Tema: ${tema}\nKarakterler arasında özgün bir diyalog oluştur.` : "Karakterler arasında yaklaşık 800 kelimelik özgün bir diyalog oluştur.");

    const HF_KEY = process.env.HUGGINGFACE_API_KEY || "";
    if (!HF_KEY) {
      console.error("HUGGINGFACE_API_KEY bulunamadı.");
      return res.status(500).json({ error: "Sunucu yapılandırma hatası: Hugging Face API anahtarı yok." });
    }

    // Tercih edilen model environment'dan alınır; yoksa küçük bir bloom modeli ile başla.
    const model = process.env.HUGGINGFACE_MODEL || "bigscience/bloomz-1b1";

    // Hugging Face Inference API'ye gönderilecek payload
    const body = {
      inputs: userPrompt,
      parameters: {
        max_new_tokens: 800, // üretilen token sayısı (çok büyük istemeyin)
        temperature: 0.8,
        do_sample: true,
      }
    };

    console.log("HuggingFace çağrısı, model:", model);

    const hfResp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    const respText = await hfResp.text().catch(() => "");
    console.error("HuggingFace raw response status:", hfResp.status);

    if (!hfResp.ok) {
      console.error("HuggingFace hata:", hfResp.status, respText.slice(0,2000));
      // 401/403/429/503 gibi hataları anlamlı dön
      return res.status(hfResp.status).json({
        error: `Hugging Face isteği başarısız: ${hfResp.status}`,
        details: respText.slice(0,2000)
      });
    }

    // Birkaç olası dönüş formatını ele al
    let parsed;
    try {
      parsed = JSON.parse(respText);
    } catch (e) {
      parsed = null;
    }

    // Format varyasyonları: [{generated_text: "..."}] veya {generated_text: "..."} veya {"error":...}
    let text = null;
    if (Array.isArray(parsed) && parsed[0]?.generated_text) {
      text = parsed[0].generated_text;
    } else if (parsed?.generated_text) {
      text = parsed.generated_text;
    } else if (typeof parsed === "string" && parsed.length > 0) {
      // Bazı modeller düz metin döner
      text = parsed;
    } else {
      // Eğer JSON parse edilemedi veya beklenen alanda değilse, raw text'i kullanmayı dene
      text = respText;
    }

    if (!text) {
      return res.status(500).json({ error: "Modelden uygun içerik alınamadı.", details: String(parsed).slice(0,2000) });
    }

    return res.status(200).json({ text });

  } catch (error) {
    console.error("🔴 API Hatası (HuggingFace handler):", error);
    return res.status(500).json({ error: error?.message || "Sunucu hatası, metin oluşturulamadı." });
  }
}
