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

  function formatRupiah(angka) {
    if (!angka) return "0";
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

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

  function handleEnter() {
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

  function sendToWhatsApp() {
    let text = `${storeName}\n` + display.textContent;
    let url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
  }

  function sendToRawBT() {
    let now = new Date();
    let hari = now.toLocaleDateString("id-ID", { weekday: 'long' });
    let tanggal = now.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
    let jam = now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
    
    let header =
`===============================
       ${storeName.toUpperCase()}
===============================

${hari}, ${tanggal} ${jam}
-------------------------------\n`;
    
    let body = items.map(it =>
      `${it.qty} ${it.nama} @${formatRupiah(it.harga)} ${formatRupiah(it.subtotal)}`
    ).join("\n");
    
    let total = items.reduce((a, b) => a + b.subtotal, 0);
    
    let footer =
`\n-------------------------------
TOTAL Rp : ${formatRupiah(total)}
-------------------------------

Terima kasih telah berbelanja!
     Sampai Jumpa Lagi 😊

--- ✂️ -------------------------------`;
    
    let struk = header + body + footer;
    
    let b64 = btoa(unescape(encodeURIComponent(struk)));
    window.open("rawbt:base64," + b64, "_blank");
  }

  // tombol angka & simbol
  document.querySelectorAll("[data-key]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("klikAudio").play();

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

  document.getElementById("backspaceBtn").addEventListener("click", () => {
    document.getElementById("klikAudio").play();

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

  document.getElementById("cancelBtn").addEventListener("click", () => {
    document.getElementById("klikAudio").play();
    qty = ""; nama = ""; harga = ""; items = []; activeIndex = -1;
    step = "qty";
    updateDisplay();
  });

  document.getElementById("abcBtn").addEventListener("click", () => {
    document.getElementById("klikAudio").play();
    if (step === "qty") {
      step = "nama";
      setKasirKeyboard("abc");
      textInput.style.opacity = 1;
      textInput.focus();
    }
    updateDisplay();
  });

  document.getElementById("enterBtn").addEventListener("click", () => {
    document.getElementById("klikAudio").play();
    handleEnter();
  });

  textInput.addEventListener("input", () => {
    nama = textInput.value;
    updateDisplay();
  });

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

  // fitur ganti nama toko dengan tombol "+"
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