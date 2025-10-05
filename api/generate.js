import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
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
