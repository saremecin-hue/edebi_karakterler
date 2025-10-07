export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || { prompt: "Karakterler arasında 2000 kelimelik diyalog oluştur" };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b", // ücretsiz ve güçlü model
        messages: [
          { role: "system", content: "Sen edebiyat alanında uzman, özgün diyaloglar yazan bir yazarsın." },
          { role: "user", content: prompt }
        ],
        max_tokens: 3500,
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      throw new Error(`API isteği başarısız: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json({ text: data.choices[0].message.content });

  } catch (error) {
    console.error("🔴 API Hatası:", error);
    res.status(500).json({ error: error.message || "Sunucu hatası, metin oluşturulamadı." });
  }
}
