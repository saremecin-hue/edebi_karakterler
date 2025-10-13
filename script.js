document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("generateBtn");
  const output = document.getElementById("output");
  const topicSelect = document.getElementById("topicSelect");

  button.addEventListener("click", async () => {
    const tema = topicSelect?.value || "";
    if (!tema) {
      output.textContent = "Lütfen bir konu/tema seçin.";
      return;
    }

    button.disabled = true;
    button.textContent = "Oluşturuluyor...";
    output.textContent = "Metin oluşturuluyor... Lütfen bekleyin.";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // backend'de beklenen alan adıyla eşleştirin (prompt veya tema)
          prompt: `Tema: ${tema}\nKarakterler arasında 2000 kelimelik özgün bir diyalog oluştur.`
        })
      });

      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Bazı hata durumları metin dönebilir; onu da yakala
        data = { error: await response.text() };
      }

      if (!response.ok) {
        console.error("Sunucu yanıtı (hatali):", response.status, data);
        output.textContent = data.error || `Sunucu hatası: ${response.status}`;
      } else {
        output.textContent = data.text || "Hata: Metin alınamadı.";
      }

    } catch (error) {
      console.error("🔴 Ağ veya JS Hatası:", error);
      output.textContent = "Ağ hatası veya sunucuya ulaşılamıyor.";
    } finally {
      button.disabled = false;
      button.textContent = "Metin Oluştur";
    }
  });
});
