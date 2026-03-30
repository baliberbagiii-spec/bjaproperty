const API_BASE = 'https://script.google.com/macros/s/AKfycbx-S6Ci6nKFPn0QMtXwQFKYyrU0_5TKz6KleBQsP-6E9SPJawh9xpRX0F1dnKwnRRLhiQ/exec';

function formatRupiah(amount) {
  if (!amount) return 'Harga tidak tersedia';
  const num = parseInt(amount.replace(/[^\d]/g, ''));
  if (isNaN(num)) return amount;
  return 'Rp ' + num.toLocaleString('id-ID');
}

async function loadProperties() {
  try {
    const response = await fetch(`${API_BASE}?action=properties`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    const grid = document.getElementById('property-grid');
    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = '<p class="text-slate-500">Tidak ada properti tersedia saat ini.</p>';
      return;
    }

    grid.innerHTML = data.map(item => {
      let statusText = '';
      let statusClass = '';
      const statusLower = item.status?.toLowerCase();
      if (statusLower === 'tersedia') {
        statusText = 'Tersedia';
        statusClass = 'text-emerald-600';
      } else if (statusLower === 'jual') {
        statusText = 'Jual';
        statusClass = 'text-blue-600';
      } else if (statusLower === 'sewa') {
        statusText = 'Sewa';
        statusClass = 'text-amber-600';
      } else {
        statusText = item.status || 'Tidak Diketahui';
        statusClass = 'text-slate-500';
      }
      return `
        <article class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <img src="${item.url_gambar}" alt="${item.idnama_properti}" loading="lazy" class="h-52 w-full object-cover" />
          <div class="p-4">
            <h3 class="font-bold text-slate-900">${item.idnama_properti}</h3>
            <p class="text-sm text-slate-600">${item.lokasi}</p>
            <p class="mt-2 text-emerald-700 font-semibold">${formatRupiah(item.harga)}</p>
            <p class="mt-2 text-sm text-slate-600">${item.deskripsi ? item.deskripsi.substring(0, 90) + '...' : ''}</p>
            <p class="mt-3 ${statusClass} font-medium">${statusText}</p>
            <div class="mt-4 flex gap-2">
              <a href="detail.html?id=${encodeURIComponent(item.idnama_properti)}" class="inline-block rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Lihat Detail</a>
              <a href="#contact" class="inline-block rounded border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50">Kontak</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  } catch (error) {
    document.getElementById('property-grid').innerHTML = `<p class="text-rose-500">Gagal memuat properti: ${error.message}</p>`;
    console.error(error);
  }
}

document.getElementById('lead-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const statusText = document.getElementById('form-status');

  const leadData = {
    nama_lengkap: form.nama_lengkap.value.trim(),
    email: form.email.value.trim(),
    no_whatsapp: form.no_whatsapp.value.trim(),
    pesan: form.pesan.value.trim()
  };

  if (!leadData.nama_lengkap || !leadData.email || !leadData.no_whatsapp || !leadData.pesan) {
    statusText.textContent = 'Harap isi semua kolom form.';
    statusText.className = 'text-rose-500';
    return;
  }

  statusText.textContent = 'Mengirim data...';
  statusText.className = 'text-slate-600';

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });

    const result = await response.json();

    if (result.status === 'success') {
      statusText.textContent = 'Terima kasih! Pesan Anda berhasil dikirim.';
      statusText.className = 'text-emerald-600';
      form.reset();
    } else {
      throw new Error(result.message || 'Gagal mengirim data.');
    }
  } catch (error) {
    statusText.textContent = 'Terjadi kesalahan saat mengirim, silakan coba lagi.';
    statusText.className = 'text-rose-500';
    console.error(error);
  }
});

loadProperties();
