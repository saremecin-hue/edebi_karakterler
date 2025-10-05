<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edebî Karakter Diyaloğu</title>
  <style>
    body { display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f9f9f9; margin:0; }
    h1 { text-align:center; margin-bottom:20px; }
    button { padding:20px 40px; font-size:1.5rem; border:none; border-radius:12px; background:#4CAF50; color:white; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:0.2s; }
    button:hover { background:#45a049; }
    #output { margin-top:30px; width:90%; max-width:700px; background:white; padding:20px; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.1); white-space:pre-wrap; font-size:1.1rem; line-height:1.5; }
    select { margin-top: 10px; padding:8px; border-radius:8px; border:1px solid #ddd; }
  </style>
</head>
<body>

  <h1>Edebî Karakter Diyaloğu</h1>
  
  <select id="topicSelect">
    <option value="" disabled selected>Konu seçin</option>
    <option value="Aşk">Aşk</option>
    <option value="Adalet">Adalet</option>
    <option value="Özgürlük">Özgürlük</option>
    <option value="Yalnızlık">Yalnızlık</option>
    <option value="Vatan">Vatan</option>
  </select>

  <button id="generateBtn">Metin Oluştur</button>
  <div id="output">Henüz metin üretilmedi.</div>

  <script src="script.js"></script>
</body>
</html>
