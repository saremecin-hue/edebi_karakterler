import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    const { prompt } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Sen eimport fs from "fs";
import path from "path";
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // JSON dosyasını oku
    const filePath = path.join(process.cwd(), "characters.json");
    const characters = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Prompt oluştur
    const characterList = characters
      .map(c => `${c.name} (${c.era}) - ${c.traits}`)
      .join(", ");

    const prompt = `
Sen edebiyat alanında uzman bir yazarsın.
Aşağıdaki karakterler arasında 2000 kelimelik yaratıcı bir diyalog oluştur.
Karakterler: ${characterList}
`;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

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
    res.status(500).json({ error: "Sunucu hatası, metin oluşturulamadı." });
  }
}
debi bir anlatım tarzına sahip, uzun ve derin diyaloglar yazan bir yapay zekasın."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 4000
    });

    res.status(200).json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

    // Frontend'den gelen prompt'u al
    const { prompt } = await req.json();

    // OpenAI API çağrısı
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Sen edebi bir anlatım tarzına sahip, uzun ve derin diyaloglar yazan bir yapay zekasın."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 4000
    });

    // Sonucu frontend'e gönder
    const result = completion.choices[0].message.content;
    res.status(200).json({ text: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
