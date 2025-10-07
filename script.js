document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("generateBtn");
  const output = document.getElementById("output");

  button.addEventListener("click", async () => {
    output.textContent = "Metin oluşturuluyor... Lütfen bekleyin.";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Karakterler arasında 2000 kelimelik özgün bir diyalog oluştur"
        })
      });

      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }

      const data = await response.json();
      output.textContent = data.text || "Hata: Metin alınamadı.";

    } catch (error) {
      console.error("🔴 Hata:", error);
      output.textContent = "Sunucu hatası, metin oluşturulamadı.";
    }
  });
});
