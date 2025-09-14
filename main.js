// === VARIABEL GLOBAL ===
let display;
let klikAudio;
let buttons;
let inputText;

let modeState = "menu";     // 'menu' | 'transferBank' | 'transferDetail' | 'tarikTunai' | 'tarikDetail'
let menuIndex = 0;          // cursor di main menu
let submenuIndex = 0;       // cursor di daftar bank transfer
let transferState = 0;      // 1=rekening,2=nominal,3=catatan,4=struk
let buffer = "";            // buffer input sementara
let rekening = "";
let nominal = 0;
let catatan = "";
let hargaList = [];

let abcMode = false;
let strukSent = false;

let tarikIndex = 0;         // cursor untuk tarik tunai
let tarikList = [
  "BRI - 599201011423508 a/n Ambar Wati",
  "BRI - 065301003742505 a/n Zaenuri",
  "BNI - 1799684970 a/n Zaenuri",
  "BCA - 5295054325 a/n Zaenuri",
  "DANA - 081329154425 a/n Ambar Wati",
  "OVO - 081211522494 a/n Zaenuri",
  "GOPAY - 081211522494 a/n Zaenuri",
  "Dana - 081211522494 a/n Zaenuri",
  "QRIS - Scan qrcode.png"
];
let tarikSent = false;      // sudah kirim ke WA atau belum

// === DAFTAR MENU & SUBMENU ===
const menuList = [
  "1. Transfer", "2. Tarik Tunai",
  "3. Pulsa", "4. Listrik", "5. Bansos"
];

const submenuList = [
  "BCA", "BRI", "BNI", "MANDIRI", "SEABANK",
  "DANA", "OVO", "GOPAY", "SHOPEE", "LAIN"
];

// === UTILITY ===
function playClick() {
  if (!klikAudio) return;
  klikAudio.currentTime = 0;
  klikAudio.play().catch(() => {});
}
function formatRupiah(angka) {
  if (angka === "" || angka === undefined || angka === null) return "Rp 0";
  return "Rp " + parseInt(angka).toLocaleString("id-ID");
}
function ambilBiaya(nom) {
  for (const h of hargaList) {
    if (nom <= h.max) return h.biaya;
  }
  return 0;
}
function showAllButtons() {
  if (!buttons) return;
  buttons.forEach(b => b.style.display = "inline-block");
}
function hideExceptAllowed() {
  if (!buttons) return;
  const allowed = new Set([".", "0", "abc", "+", "cancel", "backspace", "yasin", "enter", "←"]);
  buttons.forEach(btn => {
    const val = btn.id
      ? btn.id.replace(/Btn$/, "").toLowerCase()
      : btn.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    const normalized = val === "←" ? "←" : val;
    if (allowed.has(normalized) || allowed.has(val)) {
      btn.style.display = "inline-block";
    } else {
      btn.style.display = "none";
    }
  });
}
function setABCblink(on) {
  if (!buttons) return;
  buttons.forEach(b => {
    const val = b.id ? b.id.replace(/Btn$/, "").toLowerCase() : b.textContent.trim().toLowerCase().replace(/\s+/g, "-");
    if (val === "abc") {
      if (on) b.classList.add("blink");
      else b.classList.remove("blink");
    }
  });
}

// === RENDER MENU ===
function renderMenuWithCursor() {
  let teks = "== PILIH MENU ==\n";
  menuList.forEach((item, i) => {
    teks += (i === menuIndex ? "➡️ " : "   ") + item + "\n";
  });
  display.innerText = teks.trim();
}

// === TARIK TUNAI ===
function showTarikTunai() {
  modeState = "tarikTunai";
  tarikIndex = 0;
  tarikSent = false;
  renderTarikTunai();
}
function renderTarikTunai() {
  let teks = "== TARIK TUNAI ==\nGunakan Nav untuk pilih:\n\n";
  let visibleCount = 2; // tampil 2 rekening saja
  let start = tarikIndex;
  let end = Math.min(tarikList.length, start + visibleCount);
  
  teks += "➡️ " + tarikList[tarikIndex] + "\n"; // panah tetap di atas
  for (let i = start + 1; i < end; i++) {
    teks += "   " + tarikList[i] + "\n";
  }
  display.innerText = teks.trim();
}
function showTarikDetail() {
  modeState = "tarikDetail";
  tarikSent = false;
  if (tarikList[tarikIndex].startsWith("QRIS")) {
    // tampilkan gambar full, tanpa teks
    display.innerHTML = `<img src="qrcode.png" style="width:100%;height:100%;object-fit:contain;" />`;
  } else {
    let teks = `Silakan transfer ke:\n${tarikList[tarikIndex]}\n\nTekan ENTER untuk kirim ke WhatsApp\nTekan CANCEL untuk kembali`;
    display.innerText = teks;
  }
}
// === TRANSFER ===
function showMenu() {
  modeState = "menu";
  transferState = 0;
  buffer = "";
  rekening = "";
  nominal = 0;
  catatan = "";
  abcMode = false;
  strukSent = false;
  showAllButtons();
  setABCblink(false);
  renderMenuWithCursor();
}
function showSubmenu() {
  modeState = "transferBank";
  let teks = "== PILIH BANK ==\n\n";
  for (let i = 0; i < 5; i++) {
    const kiriIdx = i;
    const kananIdx = i + 5;
    const tandaKiri = submenuIndex === kiriIdx ? "➡" : " ";
    const tandaKanan = submenuIndex === kananIdx ? "➡" : " ";
    const kiri = `${tandaKiri}${kiriIdx + 1}. ${submenuList[kiriIdx].padEnd(7)} `;
    const kanan = `${tandaKanan}${kananIdx + 1}. ${submenuList[kananIdx]}`;
    teks += kiri + " " + kanan + "\n";
  }
  display.innerText = teks.trim();
}
function startTransfer() {
  modeState = "transferDetail";
  transferState = 1;
  buffer = "";
  rekening = "";
  nominal = 0;
  catatan = "";
  abcMode = false;
  strukSent = false;
  showAllButtons();
  setABCblink(false);
  display.innerText = `Transfer ke ${submenuList[submenuIndex]}\nMasukkan No. Rekening:`;
}
function updateTransferDisplay() {
  if (modeState !== "transferDetail") return;
  if (transferState === 1) {
    display.innerText = `Transfer ke ${submenuList[submenuIndex]}\nMasukkan No. Rekening:\n${buffer}`;
    showAllButtons(); setABCblink(false); inputText.blur(); abcMode = false;
  } else if (transferState === 2) {
    display.innerText = `No Rek: ${rekening}\nMasukkan Nominal:\n${buffer}`;
    showAllButtons(); setABCblink(false); inputText.blur(); abcMode = false;
  } else if (transferState === 3) {
    display.innerText = `No Rek: ${rekening}\nNominal: ${formatRupiah(nominal)}\nTekan ABC untuk catatan Contoh a/n Budi`;
    showAllButtons(); setABCblink(true); inputText.blur(); abcMode = false;
  } else if (transferState === 4) {
    showAllButtons(); setABCblink(false);
    const biaya = ambilBiaya(nominal);
    const struk = `PROSES\nTRANSFER\n${rekening}\n${formatRupiah(nominal)}\nCATATAN ${catatan}\nAdmin ${formatRupiah(biaya)}\nTerima kasih`;
    display.innerText = `${struk}\n\nTekan ENTER untuk kirim ke WhatsApp`;
  }
}

// === HANDLER ===
function handleEDCButton(valRaw) {
  const val = (typeof valRaw === "string") ? valRaw.toLowerCase() : valRaw;
  playClick();
  const normalVal = val.replace(/\s+/g, "-");

  // === MENU MODE ===
  if (modeState === "menu") {
    if (normalVal === "nav-down") { menuIndex = (menuIndex + 1) % menuList.length; renderMenuWithCursor(); return; }
    if (normalVal === "nav-up") { menuIndex = (menuIndex - 1 + menuList.length) % menuList.length; renderMenuWithCursor(); return; }
    if (/^[1-5]$/.test(normalVal)) { menuIndex = parseInt(normalVal) - 1; renderMenuWithCursor(); return; }
    if (normalVal === "enter") {
      switch (menuIndex) {
        case 0: submenuIndex = 0; showSubmenu(); return;
        case 1: showTarikTunai(); return;
        case 2: display.innerText = "Fitur Pulsa belum tersedia.\n\nTekan CANCEL untuk kembali."; return;
        case 3: display.innerText = "Fitur Listrik belum tersedia.\n\nTekan CANCEL untuk kembali."; return;
        case 4: display.innerText = "💰 Kamu orang kaya\nBansos hanya untuk yang miskin.\n\nTekan ENTER atau CANCEL untuk kembali."; modeState = "bansos"; return;
      }
    }
    if (normalVal === "cancel") { showMenu(); return; }
    return;
  }

  // === TARIK TUNAI ===
  if (modeState === "tarikTunai") {
    if (normalVal === "nav-down") { tarikIndex = (tarikIndex + 1) % tarikList.length; renderTarikTunai(); return; }
    if (normalVal === "nav-up") { tarikIndex = (tarikIndex - 1 + tarikList.length) % tarikList.length; renderTarikTunai(); return; }
    if (normalVal === "enter") { showTarikDetail(); return; }
    if (normalVal === "cancel") { showMenu(); return; }
    return;
  }
  if (modeState === "tarikDetail") {
  if (normalVal === "cancel") { showTarikTunai(); return; }
  if (normalVal === "enter") {
    if (!tarikSent) {
      if (tarikList[tarikIndex].startsWith("QRIS")) {
        // kirim gambar qrcode.png ke WhatsApp (pakai link gambar)
        const waImg = encodeURIComponent("https://example.com/qrcode.png");
        window.open(`https://wa.me/?text=${waImg}`, "_blank");
      } else {
        const waText = encodeURIComponent(`Silakan transfer ke:\n${tarikList[tarikIndex]}`);
        window.open(`https://wa.me/?text=${waText}`, "_blank");
      }
      display.innerText = "🔄 Sedang diproses...\nTekan ENTER untuk kembali ke menu.";
      tarikSent = true;
    } else {
      showMenu();
    }
    return;
  }
}

  // === TRANSFER BANK LIST ===
  if (modeState === "transferBank") {
    if (normalVal === "nav-down") { submenuIndex = (submenuIndex + 1) % submenuList.length; showSubmenu(); return; }
    if (normalVal === "nav-up") { submenuIndex = (submenuIndex - 1 + submenuList.length) % submenuList.length; showSubmenu(); return; }
    if (/^[1-9]$/.test(normalVal) || normalVal === "0") { submenuIndex = (normalVal === "0") ? 9 : parseInt(normalVal) - 1; showSubmenu(); return; }
    if (normalVal === "enter") { startTransfer(); return; }
    if (normalVal === "cancel") { showMenu(); return; }
    return;
  }

  // === TRANSFER DETAIL ===
  if (modeState === "transferDetail") {
    if (normalVal === "backspace" || normalVal === "←") {
      if (abcMode || transferState === 1 || transferState === 2) { buffer = buffer.slice(0, -1); updateTransferDisplay(); }
      else if (transferState > 1) { transferState--; buffer = ""; updateTransferDisplay(); }
      else { modeState = "transferBank"; showSubmenu(); }
      return;
    }
    if (normalVal === "cancel") { showMenu(); return; }
    if (normalVal === "enter") {
      if (transferState === 1 && buffer.length > 0) { rekening = buffer; buffer = ""; transferState = 2; updateTransferDisplay(); return; }
      if (transferState === 2 && buffer.length > 0) { nominal = parseInt(buffer); buffer = ""; transferState = 3; updateTransferDisplay(); return; }
      if (transferState === 3) { catatan = buffer || "-"; abcMode = false; setABCblink(false); showAllButtons(); inputText.blur(); transferState = 4; strukSent = false; updateTransferDisplay(); return; }
      if (transferState === 4) {
        if (!strukSent) {
          const biaya = ambilBiaya(nominal);
          const struk = `PROSES\nTRANSFER\n${rekening}\n${formatRupiah(nominal)}\nCATATAN ${catatan}\nAdmin ${formatRupiah(biaya)}\nTerima kasih`;
          const waText = encodeURIComponent(struk);
          window.open(`https://wa.me/6281225442038?text=${waText}`, "_blank");
          display.innerText = "🔄 Sedang diproses..."; strukSent = true;
        } else { showMenu(); }
        return;
      }
    }
    if ((normalVal === "abc") && transferState === 3) {
      if (!abcMode) { abcMode = true; inputText.value = buffer; inputText.style.zIndex = 10; try { inputText.focus(); } catch(e) {} hideExceptAllowed(); setABCblink(true); }
      else {
        if (document.activeElement === inputText) { inputText.blur(); inputText.style.zIndex = -1; abcMode = false; setABCblink(false); showAllButtons(); }
        else { try { inputText.focus(); } catch(e) {} }
      }
      return;
    }
    if (/^\d$/.test(normalVal)) {
      if (transferState === 1 || transferState === 2) { buffer += normalVal; updateTransferDisplay(); }
      else if (transferState === 3 && abcMode) { buffer += normalVal; inputText.value = buffer; updateTransferDisplay(); }
      return;
    }
    if (transferState === 3 && abcMode && (normalVal === "." || normalVal === "+")) {
      buffer += (normalVal === "." ? "." : "+"); inputText.value = buffer; updateTransferDisplay(); return;
    }
    return;
  }

  // === BANSOS ===
  if (modeState === "bansos") {
    if (normalVal === "enter" || normalVal === "cancel") { showMenu(); return; }
    return;
  }
}

// === BOOTSTRAP ===
window.addEventListener("DOMContentLoaded", () => {
  display = document.getElementById("display");
  klikAudio = document.getElementById("klikAudio");
  inputText = document.getElementById("textInput");
  buttons = document.querySelectorAll(".buttons button");

  (function ensureBlinkStyle() {
    const styleId = "mainjs-blink-style";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `.blink { animation: blink 1s infinite; } @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.15; } }`;
      document.head.appendChild(s);
    }
  })();

  if (buttons && buttons.length) {
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        let val = btn.id ? btn.id.replace(/Btn$/, "").toLowerCase() : btn.textContent.trim().toLowerCase();
        handleEDCButton(val);
      });
    });
  }

  if (inputText) {
    inputText.addEventListener("input", () => {
      buffer = inputText.value;
      if (modeState === "transferDetail" && transferState === 3) {
        display.innerText = `No Rek: ${rekening}\nNominal: ${formatRupiah(nominal)}\nCatatan:\n${buffer}`;
      }
    });
  }

  if (typeof fetch === "function") {
    fetch("harga.json")
      .then(res => res.json())
      .then(data => { hargaList = data; })
      .catch(err => { console.warn("harga.json tidak bisa dibaca:", err); hargaList = []; });
  }

  showMenu();
});