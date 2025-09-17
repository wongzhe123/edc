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
  if (!angka) return "0";
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
}

// === KASIR KEYBOARD ===
function setKasirKeyboard(mode) {
  const allBtn = buttons.querySelectorAll("button");
  allBtn.forEach(btn => btn.style.display = "inline-block");

  if (mode === "abc") {
    allBtn.forEach(btn => {
      if (
        !["abcBtn","cancelBtn","backspaceBtn","enterBtn","yasinBtn"].includes(btn.id)
        && ![".", "0", "+"].includes(btn.textContent)
      ) {
        btn.style.display = "none";
      }
    });
  }
}

// === HANDLE ENTER (UNIVERSAL) ===
function handleEnter() {
  klikAudio.play();

  if (step === "qty" && qty) {
    step = "nama";
    setKasirKeyboard("abc");
    textInput.style.opacity = 1;
    textInput.focus();
  } else if (step === "nama") {
    nama = textInput.value || "Barang";
    textInput.value = "";
    textInput.style.opacity = 0;
    step = "harga";
    setKasirKeyboard("full");

    // Tutup keyboard Android
    textInput.blur();
  } else if (step === "harga" && harga) {
    let cleanHarga = harga.replace(/\./g,""); // hilangkan titik ribuan
    let subtotal = parseFloat(qty) * parseFloat(cleanHarga);
    items.push({ qty, nama, harga: cleanHarga, subtotal });
    qty = ""; nama = ""; harga = "";
    step = "qty";
    activeIndex = -1;
    updateDisplay();
  } else if (step === "done") {
    sendToWhatsApp();
  } else if (items.length > 0 && step === "qty" && !qty) {
    step = "done";
    sendToWhatsApp();
  }
  updateDisplay();
}

// === SUPAYA ENTER DI KEYBOARD ANDROID JALAN ===
textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // cegah enter bikin newline
    handleEnter();
  }
});

// === INPUT TEXT UNTUK NAMA BARANG ===
textInput.addEventListener("input", () => {
  nama = textInput.value;
  updateDisplay();
});

// === TOMBOL ANGKA & SIMBOL ===
document.querySelectorAll("[data-key]").forEach(btn => {
  btn.addEventListener("click", () => {
    klikAudio.play();

    let key = btn.dataset.key;
    if (key === "/") {
      sendToRawBT();
      return;
    }
    if (step === "qty") {
      qty += key;
    } else if (step === "harga") {
      harga += key;
    }
    updateDisplay();
  });
});

// === BACKSPACE ===
document.getElementById("backspaceBtn").addEventListener("click", () => {
  klikAudio.play();

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
  klikAudio.play();
  qty = ""; nama = ""; harga = ""; items = []; activeIndex = -1;
  step = "qty";
  updateDisplay();
});

// === ABC ===
document.getElementById("abcBtn").addEventListener("click", () => {
  klikAudio.play();
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
  if (pass === null) return; // user cancel
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

updateDisplay();