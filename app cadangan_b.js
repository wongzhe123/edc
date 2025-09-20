// === app.js (FINAL) ===
// === SETTING AWAL ===
let storeName = "AutoUpCell"; // default nama toko
let step = "qty"; // qty -> nama -> harga -> done
let qty = "";
let nama = "";
let harga = "";
let items = [];
let activeIndex = -1;
const display = document.getElementById("display");
const buttons = document.getElementById("buttons");
const textInput = document.getElementById("textInput");
const brandName = document.getElementById("brandName");
const klikAudio = document.getElementById("klikAudio");

// === FORMAT RUPIAH ===
function formatRupiah(angka) {
  if (angka === undefined || angka === null) return "0";
  return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// === UPDATE DISPLAY ===
function updateDisplay() {
  let lines = items.map((it, idx) => {
    let prefix = (idx === activeIndex) ? ">> " : "";
    return prefix + `${it.qty} ${it.nama} @${formatRupiah(it.harga)} ${formatRupiah(it.subtotal)}`;
  });

  let total = items.reduce((a, b) => a + b.subtotal, 0);

  if (step === "qty" && qty) {
    lines.push(qty);
  } else if (step === "nama") {
    lines.push(qty + " " + (nama || ""));
  } else if (step === "harga") {
    lines.push(qty + " " + nama + " @" + (formatRupiah(harga) || ""));
  }

  if (lines.length > 0) {
    lines.push("------------------");
    lines.push("TOTAL Rp : " + formatRupiah(total));
  } else {
    lines.push("Silakan masukkan jumlah qty nama_barang @harga");
  }

  display.textContent = lines.join("\n");
  display.scrollTop = display.scrollHeight;
  brandName.textContent = storeName;

  // kedip tombol abc kalau ada qty
  const abcBtn = document.getElementById("abcBtn");
  if (abcBtn) {
    if (step === "qty" && qty) abcBtn.classList.add("blink");
    else abcBtn.classList.remove("blink");
  }
}

// === KASIR KEYBOARD ===
function setKasirKeyboard(mode) {
  const allBtn = buttons.querySelectorAll("button");
  allBtn.forEach(btn => btn.style.display = "inline-block");

  if (mode === "abc") {
    allBtn.forEach(btn => {
      if (
        !["abcBtn","cancelBtn","backspaceBtn","enterBtn","yasinBtn","funcBtn"].includes(btn.id)
        && ![".", "0", "+"].includes(btn.textContent)
      ) {
        btn.style.display = "none";
      }
    });
  }
}

// === HANDLE ENTER (BERSIH TANPA GANDA) ===
function handleEnter() {
  // main sound (jika tersedia)
  try { klikAudio.play(); } catch(e){/* ignore */ }

  if (step === "qty" && qty) {
    // pindah ke nama barang, tampilkan input teks
    step = "nama";
    setKasirKeyboard("abc");
    textInput.style.opacity = 1;
    textInput.focus();

  } else if (step === "nama") {
    // ambil nama barang dari input
    nama = (textInput.value || "Barang").toString();
    textInput.value = "";
    textInput.style.opacity = 0;
    step = "harga";
    setKasirKeyboard("full");

    // tutup keyboard Android agar user dapat memilih keypad EDC
    textInput.blur();

  } else if (step === "harga" && harga) {
    // hitung subtotal lalu kembali ke qty
    let cleanHarga = String(harga).replace(/\./g,"").replace(/[^0-9]/g,"");
    let subtotal = (parseFloat(qty) || 0) * (parseFloat(cleanHarga) || 0);
    items.push({ qty, nama, harga: cleanHarga, subtotal });
    qty = ""; nama = ""; harga = "";
    step = "qty";
    activeIndex = -1;

  } else if (step === "done") {
    sendToWhatsApp();

  } else if (items.length > 0 && step === "qty" && !qty) {
    step = "done";
    sendToWhatsApp();
  }

  updateDisplay(); // panggil sekali di akhir
}

// === SUPAYA ENTER DI KEYBOARD ANDROID JALAN ===
textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleEnter();
  }
});

// === INPUT NAMA BARANG ===
textInput.addEventListener("input", () => {
  nama = textInput.value;
  updateDisplay();
});

// === TOMBOL ANGKA & SIMBOL ===
document.querySelectorAll("[data-key]").forEach(btn => {
  btn.addEventListener("click", () => {
    try { klikAudio.play(); } catch(e){/* ignore */ }

    let key = btn.dataset.key;
    if (key === "/") { // tombol khusus: print/RawBT
      sendToRawBT();
      return;
    }

    // nomor hanya untuk qty/harga
    if (step === "qty") {
      // batasi hanya angka dan tanda titik
      if (/^[0-9.]$/.test(key)) qty += key;
    } else if (step === "harga") {
      if (/^[0-9.]$/.test(key)) harga += key;
    }
    updateDisplay();
  });
});

// === BACKSPACE ===
document.getElementById("backspaceBtn").addEventListener("click", () => {
  try { klikAudio.play(); } catch(e){/* ignore */ }

  if (activeIndex >= 0 && activeIndex < items.length) {
    items.splice(activeIndex, 1);
    if (activeIndex >= items.length) activeIndex = items.length - 1;
  } else {
    if (step === "qty" && qty) {
      qty = qty.slice(0, -1);
    } else if (step === "harga" && harga) {
      harga = harga.slice(0, -1);
    } else if (step === "nama") {
      nama = nama.slice(0, -1);
      textInput.value = nama;
    }
  }
  updateDisplay();
});

// === CANCEL ===
document.getElementById("cancelBtn").addEventListener("click", () => {
  try { klikAudio.play(); } catch(e){/* ignore */ }
  qty = ""; nama = ""; harga = ""; items = []; activeIndex = -1;
  step = "qty";
  updateDisplay();
});

// === ABC BUTTON ===
document.getElementById("abcBtn").addEventListener("click", () => {
  try { klikAudio.play(); } catch(e){/* ignore */ }
  if (step === "qty") {
    step = "nama";
    setKasirKeyboard("abc");
    textInput.style.opacity = 1;
    textInput.focus();
  }
  updateDisplay();
});

// === ENTER BUTTON ===
document.getElementById("enterBtn").addEventListener("click", () => {
  handleEnter();
});

// === NAVIGASI ATAS / BAWAH ===
document.getElementById("navUpBtn").addEventListener("click", () => {
  if (items.length > 0) {
    activeIndex = (activeIndex <= 0) ? 0 : activeIndex - 1;
    updateDisplay();
  }
});
document.getElementById("navDownBtn").addEventListener("click", () => {
  if (items.length > 0) {
    activeIndex = (activeIndex >= items.length - 1) ? items.length - 1 : activeIndex + 1;
    updateDisplay();
  }
});

// === GANTI NAMA TOKO ===
document.getElementById("changeStoreBtn").addEventListener("click", () => {
  let confirmChange = confirm("Anda ingin mengganti nama toko?\n\nLanjutkan = OK, Batal = Cancel");
  if (!confirmChange) return;

  let pass = prompt("Masukkan sandi (hubungi 081211522494 bila tidak punya):");
  if (pass === null) return;
  if (pass !== "0000") {
    alert("Sandi salah!");
    return;
  }

  let newName = prompt("Masukkan nama toko baru:", storeName);
  if (newName && newName.trim() !== "") {
    storeName = newName.trim();
    brandName.textContent = storeName;
    alert("Nama toko berhasil diubah menjadi: " + storeName);
    updateDisplay();
  }
});

// === KIRIM KE WHATSAPP ===
function sendToWhatsApp() {
  let total = items.reduce((a, b) => a + b.subtotal, 0);
  let now = new Date();
  let waktu = now.toLocaleString("id-ID", {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  let pesan = `${storeName}\n${waktu}\n\n`;
  if (items.length === 0) pesan += "(Tidak ada item)\n";
  items.forEach(it => {
    pesan += `${it.qty} ${it.nama} @${formatRupiah(it.harga)} = ${formatRupiah(it.subtotal)}\n`;
  });
  pesan += `\nTOTAL: Rp ${formatRupiah(total)}\n\nTerima kasih telah berbelanja!`;

  let url = "https://wa.me/?text=" + encodeURIComponent(pesan);

  // langsung pindah tab, tidak pakai _blank
  window.location.href = url;

  // setelah 1,5 detik reset tampilan supaya tidak bengong
  setTimeout(() => {
    updateDisplay();
  }, 1500);
}

// === PRINT VIA RAWBT ===
function sendToRawBT() {
  let total = items.reduce((a, b) => a + b.subtotal, 0);
  let now = new Date();
  let waktu = now.toLocaleString("id-ID", {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  let struk = `${storeName.toUpperCase()}\n${waktu}\n--------------------\n`;
  if (items.length === 0) struk += "(Tidak ada item)\n";
  items.forEach(it => {
    struk += `${it.qty} ${it.nama} @${formatRupiah(it.harga)} = ${formatRupiah(it.subtotal)}\n`;
  });
  struk += `\nTOTAL: Rp ${formatRupiah(total)}\n--------------------\nTerima kasih!\n`;

  let b64 = btoa(unescape(encodeURIComponent(struk)));

  // langsung arahkan ke rawbt, jangan pakai _blank
  window.location.href = "rawbt:base64," + b64;

  // delay updateDisplay biar UI tetap hidup
  setTimeout(() => {
    updateDisplay();
  }, 1500);
}


function goFunch() {
  try { klikAudio.play(); } catch (e) { /* ignore */ }
  window.location.href = "funch/funch.html";
}