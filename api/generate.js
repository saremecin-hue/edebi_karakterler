import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { prompt } = req.body || { prompt: "Karakterler arasında 2000 kelimelik diyalog oluştur" };

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Sen edebiyat alanında uzman bir yazarsın." },
        { role: "user", content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.8
    });

    res.status(200).json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("🔴 API Hatası:", error);
    res.status(500).json({ error: error.message || "Sunucu hatası, metin oluşturulamadı." });
  }
}
