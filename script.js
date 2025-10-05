// Karakterler ve açıklamaları
const characters = [
  { id:"ince_memed", name:"İnce Memed", desc:"Asi, adalet arayışında, köylüleri ağalara karşı savunur. 1930'lar Anadolu’su." },
  { id:"feride", name:"Feride (Çalıkuşu)", desc:"İdealist öğretmen; fedakâr, modernleşmeyi ve topluma hizmeti önemser." },
  { id:"aylak_adam", name:"Aylak Adam (C.)", desc:"Yalnız, şehirli, modern bireyin yabancılaşmasını yansıtır." },
  { id:"küçük_prens", name:"Küçük Prens", desc:"Saf, sorgulayıcı, hayata çocuk gözüyle bakan." },
  { id:"meursault", name:"Meursault (Yabancı)", desc:"Kaygısız, toplumsal normlara uymayan; varoluşçu edebiyatın simgesi." }
];

document.getElementById("generateBtn").addEventListener("click", async () => {
  const topic = document.getElementById("topicSelect").value;
  if (!topic) {
    alert("Lütfen önce bir konu seçin.");
    return;
  }

  const prompt = `Aşağıdaki karakterleri kullanarak "${topic}" konulu en az 2000 kelimelik, tamamen özgün bir diyalog yaz. Karakterlerin açıklamaları ve özellikleri şöyledir:\n\n` +
    characters.map(c => `${c.name}: ${c.desc}`).join("\n") +
    `\n\nDiyalog, karakterlerin dönemlerine uygun olmalı, kitaplardan alıntı içermemeli.`;

  try {
    const response = await fetch("https://edebi-karakterler-mzt5e6lpx-saremecins-projects.vercel.app/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt:  "Karakterler arasında 2000 kelimelik diyalog oluştur" })
    });

    const data = await response.json();
    const text = data.text || "Hata: metin alınamadı.";
    document.getElementById("output").textContent = text;
  } catch (err) {
    console.error(err);
    document.getElementById("output").textContent = "Sunucu hatası, metin oluşturulamadı.";
  }
});
