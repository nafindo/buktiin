# Product Requirements Document (PRD)
# BUKTIIN - Bukti Packing, Aman Kirim
# Developed by: Nafindo Group
# Version: 4.0 Final Release
# Last Updated: Juni 2026

---

# 1. BRAND IDENTITY

## 1.1 Nama Aplikasi

**BUKTIIN**

Tagline: *"Bukti Packing, Aman Kirim"*

## 1.2 Kenapa "BUKTIIN"?

| Aspek | Penjelasan |
|-------|------------|
| **Arti** | "Buktiin" = buktikan (bahasa gaul Indonesia) |
| **Konsep** | Buktiin packing = buktikan barang sudah dipack dengan benar |
| **Kelebihan** | Sangat lokal, gaul, millenial/gen-Z friendly |
| **Mudah diingat** | 1 kata, 3 suku kata, catchy |
| **Mudah diucapkan** | Buk-ti-in — mengalir, tidak patah-patah |
| **Viral potential** | Bahasa gaul = mudah viral di sosmed |
| **SEO friendly** | Unik, tidak ada kompetitor |
| **Domain** | buktiin.id / buktiinpack.id |

## 1.3 Logo & Branding Guidelines

```
┌─────────────────────────────────────────┐
│                                         │
│   [Logo BUKTIIN]                        │
│   ─────────────────                     │
│                                         │
│   Warna Primary:   #00C853 (Hijau)     │
│   Warna Secondary: #FF6B00 (Orange)     │
│   Warna Accent:    #FFFFFF (Putih)      │
│   Font:            Poppins Bold         │
│                                         │
│   Logo Variants:                        │
│   • Full: BUKTIIN + icon centang ✓     │
│   • Icon: Centang ✓ + kardus            │
│   • Mini: B monogram                  │
│                                         │
└─────────────────────────────────────────┘
```

## 1.4 Developer Credit

**Developed by Nafindo Group**
- Website: www.nafindo.co.id
- Email: support@nafindo.co.id
- WhatsApp: 0812-xxxx-xxxx
- Lokasi: Bandung, Jawa Barat — Indonesia
- © 2026 Nafindo Group. All Rights Reserved.

Setiap tampilan aplikasi (login, dashboard, footer, invoice) mencantumkan:
```
"BUKTIIN — Developed by Nafindo Group"
"© 2026 Nafindo Group. All Rights Reserved."
```

---

# 2. VISI & MISI

## 2.1 Visi
> Menjadi aplikasi bukti packing #1 di Indonesia yang melindungi seller e-commerce dari komplain palsu.

## 2.2 Misi
1. Memberikan bukti video packing yang otomatis, jelas, dan terintegrasi
2. Melindungi seller dari kerugian akibat komplain tidak wajar
3. Meningkatkan kepercayaan customer melalui transparansi packing
4. Membuat proses packing lebih efisien dan tersertifikasi

---

# 3. TARGET USER

| Segmen | Volume | Karakteristik | Kebutuhan Utama |
|--------|--------|---------------|-----------------|
| **Seller Pemula** | 10-50 order/hari | Side hustle, baru mulai | Murah, simpel, gampang pakai |
| **Seller Growing** | 50-300 order/hari | Fokus full-time, ada staff | Multi-user, history, laporan |
| **Warehouse/Brand** | 300-2000 order/hari | Tim besar, multi marketplace | Scale, audit, integrasi penuh |

---

# 4. FITUR LENGKAP

## 4.1 CORE FEATURES (MVP)

### F1: Live Scanner (Halaman Utama Packing)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN          [🔔] [👤 User] [⚙️] [🚪]          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📦 LIVE SCANNER                                            │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │  [📷 Webcam Preview - Live]                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │                                                     │   │   │
│  │  │         [Area Packing - Meja Biru]                 │   │   │
│  │  │                                                     │   │   │
│  │  │  📹 REC ● 00:01:23                                   │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  📋 DETAIL ORDER (Auto muncul setelah scan)               │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  🏪 Marketplace: Shopee                              │   │   │
│  │  │  📋 Resi: JX123456789                              │   │   │
│  │  │  👤 Customer: Budi Santoso                         │   │   │
│  │  │                                                     │   │   │
│  │  │  🛒 Items:                                          │   │   │
│  │  │  • Kaos Polos — Kuning, L (x2)                     │   │   │
│  │  │  • Celana Chino — Hitam, 32 (x1)                   │   │   │
│  │  │                                                     │   │   │
│  │  │  [📷 Mulai Rekam]  [✅ Selesai Packing]            │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📊 STATUS REAL-TIME                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🟢 45 Selesai  |  🟡 3 Diproses  |  🔴 0 Gagal          │   │
│  │  💾 Storage: 37.5 GB / 50 GB (75%)                        │   │
│  │  [📊 Detail Status]                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Fitur Detail:**
- Scan barcode otomatis (USB barcode scanner)
- Webcam preview live (auto-start saat scan)
- Detail order muncul otomatis (nama, varian, jumlah, gambar)
- Tombol "Mulai Rekam" & "Selesai Packing"
- Status real-time (selesai/diproses/gagal)
- Storage usage indicator

### F2: Video Recording & Compression (Background)

**Alur Kerja:**
```
User Scan → Detail Muncul → Rekam Packing → Klik Selesai
                                              ↓
                                    ✅ "Packing Selesai! Lanjut ke berikutnya"
                                              ↓
                                    [BACKGROUND - Tidak ganggu user]
                                    Simpan Lokal → Queue (Redis) → FFmpeg Kompresi
                                    → Upload Hot Storage → Notif "Video Siap!"
```

**Parameter Kompresi:**
| Parameter | Standard | High Compression | Quality |
|-----------|----------|------------------|---------|
| Codec | H.264 (libx264) | H.264 | H.264 |
| Resolution | 720p (1280x720) | 480p (854x480) | 1080p (1920x1080) |
| Bitrate | 800 kbps | 500 kbps | 1500 kbps |
| FPS | 24 | 20 | 30 |
| CRF | 28 | 30 | 23 |
| Audio | Mono 64kbps | Mono 48kbps | Stereo 96kbps |
| Output Size | 10-12 MB | 5-6 MB | 30-35 MB |
| Reduction | 83% | 91% | 78% |

**Keuntungan Async Upload:**
| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| User wait time | 30-120 detik | **0 detik** |
| Packing throughput | 20-30 order/jam | **50-80 order/jam** |
| UX | Frustrated | **Happy** |

### F3: Scan History

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN — Riwayat Scan & Video                       │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  [🔍 Cari Resi/Customer...]  [📅 Filter Tanggal]  [📤 Export CSV]   │
│                                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ Tanggal  │ Resi     │ Customer │ Items    │ Status   │ Video  │ │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┼────────┤ │
│  │ 25/06/26 │ JX123..  │ Budi S.  │ 2 items  │ 🟢 Selesai│ [▶️]  │ │
│  │ 25/06/26 │ JX456..  │ Rina W.  │ 1 item   │ 🟢 Selesai│ [▶️]  │ │
│  │ 24/06/26 │ JX789..  │ Andi K.  │ 3 items  │ 🟢 Selesai│ [▶️]  │ │
│  │ 24/06/26 │ JX012..  │ Dina M.  │ 1 item   │ 🟡 Proses │ [⏳]  │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴────────┘ │
│                                                                     │
│  [⏮️] [1] [2] [3] ... [10] [⏭️]  Show 25 per halaman             │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### F4: Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN — Dashboard                                  │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📊 STATISTIK HARI INI                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ 📦 Total   │  │ ✅ Selesai │  │ ⏳ Proses  │  │ 📹 Video   │   │
│  │    320     │  │    280     │  │    3       │  │   278      │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                     │
│  💰 PENDAPATAN & LANGGANAN                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ 💵 Revenue │  │ 👥 Active  │  │ 🆕 New     │  │ 📉 Churn   │   │
│  │  Rp 45.2jt │  │   1,245    │  │    45      │  │    12      │   │
│  │  (30 hari) │  │   (bulan)  │  │  (7 hari)  │  │  (bulan)   │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                     │
│  📈 GRAFIK TREN                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Line Chart: Order Harian - 30 hari terakhir]             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📊 BREAKDOWN MARKETPLACE                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Pie Chart]                                                │   │
│  │  🟠 Shopee 60%  |  🟢 Tokopedia 25%  |  🔵 TikTok 15%      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  🔔 AKTIVITAS TERBARU                                               │
│  • 10:30 — Video packing JX123456 selesai diupload (8.5 MB)       │
│  • 10:15 — User Rina W. upgrade ke plan Starter                    │
│  • 10:00 — 45 auto-renewal berhasil diproses                       │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### F5: Storage Management

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN — Kelola Storage                             │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📊 PENGGUNAAN STORAGE                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📦 37.5 GB / 50 GB (Starter Plan)                          │   │
│  │  [██████████████████░░░░░░░░░░░░░░░░░░] 75%                  │   │
│  │                                                             │   │
│  │  💡 Tips: Aktifkan auto-delete untuk hemat storage          │   │
│  │                                                             │   │
│  │  [⚙️ Kelola Storage]  [⬆️ Upgrade ke Pro]                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  🗂️ VIDEO MANAGEMENT                                                │
│  ┌──────────┬──────────┬────────┬──────────┬──────────┐          │
│  │ Tanggal  │ Resi     │ Ukuran │ Marketplace │ Aksi  │          │
│  ├──────────┼──────────┼────────┼───────────┼───────┤          │
│  │ 25/06/26 │ JX123..  │ 8.5 MB │ Shopee    │ [🗑️] │          │
│  │ 24/06/26 │ JX456..  │ 9.2 MB │ Tokopedia │ [🗑️] │          │
│  │ 23/06/26 │ JX789..  │ 12 MB  │ TikTok    │ [🗑️] │          │
│  └──────────┴──────────┴────────┴───────────┴───────┘          │
│                                                                     │
│  ⚙️ AUTO-DELETE                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [✅] Aktifkan Auto-Delete                                  │   │
│  │  Hapus video lebih dari: [30] hari (range: 7-90)          │   │
│  │  [💾 Simpan Pengaturan]                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### F6: User Profile & Settings

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN — Profil Pengguna                            │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [📷 Foto Profil]                                          │   │
│  │                                                             │   │
│  │  Nama: Budi Santoso                                         │   │
│  │  Email: budi@email.com                                      │   │
│  │  Telepon: 0812xxxxxx                                        │   │
│  │  Toko: Budi Fashion Store                                   │   │
│  │                                                             │   │
│  │  [✏️ Edit Profil]                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  💳 LANGGANAN SAYA                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Plan: Starter (Rp 99,000/bulan)                            │   │
│  │  Status: 🟢 AKTIF                                           │   │
│  │  Masa Aktif: 15 Jun 2026 — 15 Jul 2026                     │   │
│  │  Sisa Hari: 12 hari                                         │   │
│  │  Auto-Renew: ON                                             │   │
│  │                                                             │   │
│  │  [⬆️ Upgrade ke Pro]  [⬇️ Downgrade ke Basic]  [❌ Cancel]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ⚙️ PENGATURAN                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🎥 Webcam: [Pilih Kamera ▼]                                │   │
│  │  📹 Kualitas Video: [720p ●] [1080p ○]                     │   │
│  │  🔔 Notifikasi: [✅ Email] [✅ Push] [❌ SMS]              │   │
│  │  🌐 Bahasa: [Bahasa Indonesia ●] [English ○]               │   │
│  │  🏪 Marketplace Terhubung:                                  │   │
│  │     [✅ Shopee] [✅ Tokopedia] [❌ TikTok] [❌ Lazada]    │   │
│  │                                                             │   │
│  │  [💾 Simpan Perubahan]                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 4.2 ADMIN FEATURES (BUKTIIN Admin Console)

### A1: Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN — Admin Console                              │
│  👤 Admin: Dika (Super Admin)     [🔔 3] [🚪 Logout]                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📊 OVERVIEW SISTEM                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ 👥 Total   │  │ 🟢 Active  │  │ 💰 Revenue │  │ 🆕 New     │   │
│  │   1,245    │  │    1,180   │  │  Rp 45.2jt │  │    45      │   │
│  │   Users    │  │   (95%)    │  │  (30 hari) │  │  (7 hari)  │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                     │
│  📈 GRAFIK PENDAPATAN                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Line Chart: Revenue 30 hari - Target vs Actual]         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📊 DISTRIBUSI PLAN                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Pie Chart]                                                │   │
│  │  🆓 Free 5% | 💙 Basic 25% | 💚 Starter 35% | 💛 Pro 25%    │   │
│  │  🧡 Business 8% | ❤️ Enterprise 2%                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  🔔 AKTIVITAS TERBARU (Admin Log)                                   │
│  • 10:30 — Admin Sari: Extend subscription Budi S. (+7 hari)       │
│  • 10:15 — System: Auto-renewal 45 user berhasil                   │
│  • 09:45 — System: Webhook Midtrans received (PAID)                │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### A2: User Management

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN — Manajemen Pengguna                         │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  [🔍 Cari nama/email...]  [Filter ▼]  [📤 Export CSV]  [+ Tambah]   │
│                                                                     │
│  ┌────┬──────────────┬─────────────┬──────────┬──────────┬──────┐ │
│  │ ☐  │ Nama         │ Email       │ Plan     │ Status   │ Aksi │ │
│  ├────┼──────────────┼─────────────┼──────────┼──────────┼──────┤ │
│  │ ☐  │ Budi S.      │b@email.com  │ Starter  │ 🟢 Aktif │ [👁️]│ │
│  │ ☐  │ Rina W.      │r@email.com  │ Pro      │ 🟢 Aktif │ [👁️]│ │
│  │ ☐  │ Andi K.      │a@email.com  │ Basic    │ 🟡 Grace │ [👁️]│ │
│  │ ☐  │ Dina M.      │d@email.com  │ Free     │ 🔴 Expire│ [👁️]│ │
│  └────┴──────────────┴─────────────┴──────────┴──────────┴──────┘ │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### A3: Plan & Pricing Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN — Konfigurasi Paket & Harga                    │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   🆓 FREE    │  │  💙 BASIC    │  │  💚 STARTER  │          │
│  │  Rp 0        │  │  Rp 49,000   │  │  Rp 99,000   │          │
│  │  [Edit]      │  │  [Edit]      │  │  [Edit]      │          │
│  │              │  │              │  │              │          │
│  │ Storage: 5GB │  │ Storage: 20GB│  │ Storage: 50GB│          │
│  │ Order: 10/hr │  │ Order: 30/hr │  │ Order: 100/hr│          │
│  │ User: 1      │  │ User: 1      │  │ User: 2      │          │
│  │ Retention: 7d│  │ Retention: 14d│  │ Retention: 30d│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  💛 PRO      │  │ 🧡 BUSINESS  │  │ ❤️ ENTERPRISE│          │
│  │  Rp 199,000  │  │  Rp 399,000  │  │  Custom      │          │
│  │  [Edit]      │  │  [Edit]      │  │  [Edit]      │          │
│  │              │  │              │  │              │          │
│  │ Storage: 150G│  │ Storage: 500G│  │ Unlimited    │          │
│  │ Order: 300/hr│  │ Order: 1000/h│  │ Unlimited    │          │
│  │ User: 5      │  │ User: 10     │  │ Unlimited    │          │
│  │ Retention: 60d│  │ Retention: 90d│  │ Custom       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                     │
│  [➕ Tambah Paket Baru]                                             │
│                                                                     │
│  🎁 PROMO & DISKON                                                   │
│  ┌──────────┬──────────┬────────┬──────────┬──────────┐         │
│  │ Kode     │ Diskon   │ Min    │ Berlaku  │ Status   │         │
│  ├──────────┼──────────┼────────┼──────────┼──────────┤         │
│  │ BUKTI50  │ 50%      │ -      │ 30 hari  │ 🟢 Aktif │         │
│  │ BULANAN  │ 20%      │ 3 bln  │ 7 hari   │ 🟢 Aktif │         │
│  └──────────┴──────────┴────────┴──────────┴──────────┘         │
│                                                                     │
│  [➕ Tambah Promo]                                                   │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 4.3 PAYMENT & BILLING

### P1: Payment Page (User)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo BUKTIIN] BUKTIIN — Pembayaran                                 │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📋 RINGKASAN PESANAN                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Paket: Starter (30 hari)                                   │   │
│  │  Harga: Rp 99,000                                           │   │
│  │  PPN 11%: Rp 10,890                                         │   │
│  │  ────────────────────────────────────────                   │   │
│  │  TOTAL: Rp 109,890                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  💳 PILIH METODE PEMBAYARAN                                          │
│                                                                     │
│  [💳 Virtual Account]  [📱 E-Wallet]  [📷 QRIS]                      │
│                                                                     │
│  Virtual Account:                                                    │
│  [●] BCA    [ ] BNI    [ ] BRI    [ ] Mandiri                     │
│                                                                     │
│  Nomor VA: 12345 67890 12345                                        │
│  [📋 Salin Nomor]                                                   │
│                                                                     │
│  ⏳ Bayar sebelum: 25 Jun 2026, 23:59 WIB                           │
│                                                                     │
│  [✅ Saya sudah bayar]  [❌ Batal]                                  │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  BUKTIIN — Developed by Nafindo Group                                │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### P2: Payment Success (Instant)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    🎉 PEMBAYARAN BERHASIL!                            │
│                                                                     │
│              BUKTIIN Starter telah aktif!                              │
│                                                                     │
│  Invoice: BUK-INV-20240625-001                                       │
│  Masa Aktif: 25 Jun 2026 — 25 Jul 2026                              │
│                                                                     │
│  [🚀 Mulai Packing Sekarang]    [📥 Download Invoice]               │
│                                                                     │
│  Fitur yang aktif:                                                   │
│  ✓ 100 order/hari     ✓ 2 user                                     │
│  ✓ 50 GB storage      ✓ 30 hari retention                          │
│  ✓ Integrasi Shopee, Tokopedia, TikTok Shop                        │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Butuh bantuan? Hubungi kami:                                        │
│  📧 support@nafindo.co.id                                           │
│  📱 WhatsApp: 0812-xxxx-xxxx                                        │
│                                                                     │
│  BUKTIIN — Developed by Nafindo Group                                  │
│  © 2026 Nafindo Group. All Rights Reserved.                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 5. STRUKTUR PAKET & HARGA

## 5.1 Pricing Tiers

| Plan | Harga/Bulan | Storage | Orders/Hari | Users | Retention | Video Quality | Best For |
|------|------------|---------|-------------|-------|-----------|---------------|----------|
| **🆓 Free** | Rp 0 | 5 GB | 10 | 1 | 7 hari | 720p | Trial |
| **💙 Basic** | **Rp 49,000** | 20 GB | 30 | 1 | 14 hari | 720p (high compression) | Seller pemula |
| **💚 Starter** | **Rp 99,000** | 50 GB | 100 | 2 | 30 hari | 720p/1080p | Seller growing |
| **💛 Pro** | **Rp 199,000** | 150 GB | 300 | 5 | 60 hari | 1080p | Seller established |
| **🧡 Business** | **Rp 399,000** | 500 GB | 1,000 | 10 | 90 hari | 1080p | Tim/Warehouse |
| **❤️ Enterprise** | Custom | Unlimited | Unlimited | Unlimited | Custom | 1080p/4K | Large ops |

## 5.2 Add-ons

| Add-on | Harga | Keterangan |
|--------|-------|------------|
| Extra Storage +50 GB | Rp 25,000/bulan | Tanpa ganti plan |
| Extra Storage +100 GB | Rp 45,000/bulan | Lebih hemat |
| Extra User +1 | Rp 15,000/bulan | Basic/Starter only |
| 1080p Upgrade | Rp 20,000/bulan | Dari 720p |

## 5.3 Annual Discount

| Plan | Monthly | Annual (12 bulan) | Hemat |
|------|---------|-------------------|-------|
| Basic | Rp 49,000 | Rp 490,000 | **2 bulan gratis (17%)** |
| Starter | Rp 99,000 | Rp 990,000 | **2 bulan gratis (17%)** |
| Pro | Rp 199,000 | Rp 1,990,000 | **2 bulan gratis (17%)** |
| Business | Rp 399,000 | Rp 3,990,000 | **2 bulan gratis (17%)** |

---

# 6. INFRASTRUCTURE

## 6.1 Hybrid Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BUKTIIN — HYBRID STORAGE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LAYER 1: HOT STORAGE (Local SSD/NVMe)                             │
│   ├── Retention: 7-14 hari                                          │
│   ├── Speed: < 100ms latency                                         │
│   ├── Purpose: Real-time playback                                   │
│   └── Cost: Rp 0 (sudah di server)                                  │
│                                                                     │
│   LAYER 2: WARM STORAGE (Cloud Object Storage: S3/R2)              │
│   ├── Retention: 15-30 hari                                         │
│   ├── Speed: 200-500ms latency                                       │
│   ├── Purpose: Backup & history                                     │
│   └── Cost: ~$0.023/GB = ~Rp 350/GB/bulan                          │
│                                                                     │
│   LAYER 3: COLD STORAGE (Google Drive 5TB via Gemini Pro)           │
│   ├── Retention: 30-90 hari (configurable)                          │
│   ├── Speed: 2-5 detik latency (OK untuk archive)                  │
│   ├── Purpose: Archive & disaster recovery                            │
│   └── Cost: Rp 0 (termasuk Gemini Pro!)                             │
│                                                                     │
│   AUTO-MIGRATION:                                                   │
│   Day 0-7   → HOT (Local SSD)                                       │
│   Day 8-30  → WARM (Cloud S3/R2)                                    │
│   Day 31-90 → COLD (Google Drive 5TB)                               │
│   Day 90+   → AUTO-DELETE (jika diatur)                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 6.2 Self-Hosted Server Options

| Opsi | Harga Beli | Listrik/Bln | CPU | RAM | Video Encode | Score | Rekomendasi |
|------|-----------|-------------|-----|-----|--------------|-------|-------------|
| **STB** | Rp 150k-300k | Rp 30k-50k | ARM A53 | 8GB | ❌ Software | 4/10 | ❌ Tidak |
| **Mini PC N5105** | Rp 800k-1.2jt | Rp 60k-100k | Intel x86 | 16GB | ✅ Quick Sync | **8/10** | ✅ **Best Value** |
| **Raspberry Pi 5** | Rp 1.2jt-1.8jt | Rp 30k-50k | ARM A76 | 8GB | ❌ Software | 6/10 | ⚠️ OK |
| **Laptop i5-8th** | Rp 1.5jt-2.5jt | Rp 150k-200k | Intel x86 | 32GB | ✅ Quick Sync | **9/10** | ✅ **Best Performance** |

## 6.3 Recommended Setup by Phase

### Fase 1: Startup (0-50 users)
```
Mini PC Intel N5105 (Bekas: Rp 800k-1.2jt)
├── RAM: 8GB DDR4
├── SSD: 256GB NVMe (OS + App + Hot Storage)
├── External HDD: 2TB USB 3.0 (Warm Storage)
├── OS: Ubuntu Server 22.04 LTS
├── App: Node.js + PostgreSQL + Redis (all in one)
├── Compression: FFmpeg dengan Intel Quick Sync
└── Listrik: ~10W (Rp 60k-100k/bulan)

Total Operasional: Rp 60k-100k/bulan + Rp 320k Gemini = Rp 380k-420k/bulan
```

### Fase 2: Growth (50-200 users)
```
Bekas Laptop i5-8th Gen (Rp 1.5jt-2.5jt)
├── RAM: 16GB DDR4
├── SSD: 256GB NVMe (OS + App + Hot Storage)
├── HDD: 1TB 2.5" (Warm Storage)
├── OS: Ubuntu Server 22.04 LTS
├── App: Node.js + PostgreSQL + Redis
├── Compression: FFmpeg dengan Intel Quick Sync
└── Listrik: ~30-40W (Rp 150k-200k/bulan)

Total Operasional: Rp 150k-200k/bulan + Rp 320k Gemini = Rp 470k-520k/bulan
```

---

# 7. BIAYA & PROFITABILITAS

## 7.1 Biaya Bulanan Lengkap

| Item | Fase 1 (Mini PC) | Fase 2 (Laptop) |
|------|-----------------|-----------------|
| Server Hardware | Rp 0 (sudah beli) | Rp 0 |
| Listrik | Rp 60k-100k | Rp 150k-200k |
| Internet (ISP)* | Rp 300k-400k | Rp 300k-400k |
| Gemini Pro (5TB) | Rp 320k | Rp 320k |
| Domain + SSL | Rp 50k | Rp 50k |
| **TOTAL FIXED** | **Rp 730k-870k** | **Rp 820k-970k** |

> *Internet ISP: sudah ada untuk operasional warehouse

## 7.2 Profit Margin

| Plan | Price | Cost | Profit | Margin |
|------|-------|------|--------|--------|
| Basic | Rp 49,000 | Rp 4,500 | **Rp 44,500** | **91%** |
| Starter | Rp 99,000 | Rp 10,000 | **Rp 89,000** | **90%** |
| Pro | Rp 199,000 | Rp 25,000 | **Rp 174,000** | **87%** |
| Business | Rp 399,000 | Rp 70,000 | **Rp 329,000** | **82%** |

## 7.3 Break-Even Analysis

| Target | Fase 1 (Mini PC) | Fase 2 (Laptop) |
|--------|-----------------|-----------------|
| Cover Fixed Cost | 15 users Basic | 17 users Basic |
| 2x Fixed (Profit) | 30 users Basic | 34 users Basic |
| 5x Fixed (Good) | 75 users Basic | 84 users Basic |

## 7.4 Revenue Projection (Fase 1)

| Bulan | Users | Revenue | Fixed Cost | Variable Cost | Total Cost | Profit | Margin |
|-------|-------|---------|------------|---------------|------------|--------|--------|
| 1 | 20 | Rp 1,500,000 | Rp 730k | Rp 90k | Rp 820k | **Rp 680k** | 45% |
| 3 | 50 | Rp 3,750,000 | Rp 730k | Rp 225k | Rp 955k | **Rp 2,795k** | 75% |
| 6 | 100 | Rp 7,500,000 | Rp 730k | Rp 450k | Rp 1,180k | **Rp 6,320k** | 84% |
| 12 | 200 | Rp 15,000,000 | Rp 730k | Rp 900k | Rp 1,630k | **Rp 13,370k** | 89% |

---

# 8. KEAMANAN & RELIABILITY

## 8.1 Self-Hosted Server Protection

| Risiko | Mitigasi | Biaya |
|--------|----------|-------|
| Listrik mati | UPS 600VA + auto-shutdown | Rp 300k (satu kali) |
| Internet down | Backup 4G / Cloudflare Tunnel | Rp 0 |
| Hardware rusak | Backup otomatis ke Google Drive 5TB | Rp 0 |
| Overheating | Fan + thermal monitoring | Rp 50k |
| Power surge | UPS dengan surge protection | Sudah di UPS |

## 8.2 Data Security

| Aspek | Implementasi |
|-------|-------------|
| Enkripsi video | AES-256 saat transit & rest |
| Akses video | Role-based (Admin, Staff, Viewer) |
| Retention | Auto-delete setelah 90 hari (configurable) |
| Compliance | PSE (Penyelenggara Sistem Elektronik) |
| Backup | Daily backup ke Google Drive terpisah |
| Audit log | Log semua aktivitas scan & akses video |

---

# 9. KPI & METRIK

| Metrik | Target | Cara Ukur |
|--------|--------|-----------|
| User Activation Time | < 1 menit (auto) | Timer |
| Video Compression Time | < 30 detik (2 min video) | Backend log |
| Upload Success Rate | > 99% | Backend log |
| Storage Usage Alert | < 80% users | Monitoring |
| Payment Success Rate | > 95% | Payment gateway |
| System Uptime | 99.5% | Monitoring |
| Churn Rate | < 5%/bulan | Analytics |
| MRR Growth | +10%/bulan | Finance report |

---

# 10. ROADMAP

### Phase 1: MVP (Q3 2026)
- [x] Live Scanner dengan barcode
- [x] Video recording otomatis
- [x] Async upload dengan queue
- [x] Video compression (FFmpeg)
- [x] Storage limits & auto-delete
- [x] Self-hosted deployment (Mini PC/laptop)
- [x] Integrasi Shopee & Tokopedia
- [x] Payment system (Midtrans webhook)
- [x] Admin dashboard basic

### Phase 2: Enhancement (Q4 2026)
- [ ] Integrasi TikTok Shop, Lazada, Blibli
- [ ] Multi-user & role management
- [ ] Watermark custom (logo BUKTIIN)
- [ ] Mobile responsive
- [ ] Notifikasi komplain
- [ ] Advanced analytics & charts
- [ ] Promo code system
- [ ] Bulk actions (export, email blast)

### Phase 3: Advanced (Q1 2027)
- [ ] AI Object Detection (verifikasi item)
- [ ] Multi-camera support
- [ ] Auto-upload cloud (Google Drive integration)
- [ ] Customer portal (lihat video packing)
- [ ] Mobile app (iOS & Android)
- [ ] API publik untuk partner
- [ ] White-label solution

### Phase 4: Scale (Q2 2027)
- [ ] Multi-tenant (reseller)
- [ ] International expansion
- [ ] Advanced RBAC (custom roles)
- [ ] Machine learning (churn prediction)
- [ ] Automated report scheduling

---

# 11. BRANDING & FOOTER

## 11.1 Footer di Semua Halaman

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  BUKTIIN — Developed by Nafindo Group                                │
│  📧 support@nafindo.co.id | 📱 WhatsApp: 0812-xxxx-xxxx              │
│  🌐 www.nafindo.co.id | 📍 Bandung, Jawa Barat — Indonesia           │
│                                                                     │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│  [🌐 Bahasa Indonesia] [🌐 English]                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 11.2 Invoice Template

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  [Logo BUKTIIN]                                                     │
│  BUKTIIN — Bukti Packing, Aman Kirim                                 │
│  Developed by Nafindo Group                                           │
│  www.nafindo.co.id | support@nafindo.co.id                           │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  INVOICE: BUK-INV-20240625-001                                     │
│                                                                     │
│  Kepada: Budi Santoso                                               │
│  Email: budi@email.com                                              │
│                                                                     │
│  Deskripsi: Langganan Paket Starter (30 hari)                      │
│  Harga: Rp 99,000                                                   │
│  PPN 11%: Rp 10,890                                                 │
│  ────────────────────────────────────────                           │
│  TOTAL: Rp 109,890                                                  │
│                                                                     │
│  Status: ✅ LUNAS                                                    │
│  Metode: Virtual Account BCA                                        │
│  Tanggal: 25 Juni 2026                                             │
│                                                                     │
│  Terima kasih telah menggunakan BUKTIIN!                               │
│  Developed by Nafindo Group                                           │
│  © 2026 Nafindo Group. All Rights Reserved.                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 12. KESIMPULAN

| Pertanyaan | Jawaban |
|------------|---------|
| **Nama aplikasi?** | **BUKTIIN** — simple, gaul, mudah diingat |
| **Tagline?** | *"Bukti Packing, Aman Kirim"* |
| **Developer?** | **Nafindo Group** |
| **Murah untuk user?** | ✅ **Rp 49,000** (67% lebih murah dari kompetitor) |
| **Untung untuk owner?** | ✅ **Margin 82-91%**, break-even 15 users |
| **Efisien untuk operasional?** | ✅ **Async upload**, 2-3x lebih produktif |
| **Bisa self-hosted?** | ✅ **Mini PC Rp 800k-1.2jt** atau **laptop bekas** |
| **Hemat vs VPS?** | ✅ **Rp 1.4-5.9 juta/tahun** |
| **Video jelas?** | ✅ **FFmpeg 720p**, readable & identifiable |
| **Scalable?** | ✅ **Queue system**, tiered storage, load balance |
| **Brand kuat?** | ✅ **BUKTIIN** — viral potential, gaul, millenial-friendly |

**BUKTIIN by Nafindo Group = Solusi bukti packing #1 di Indonesia!**

---

**Document Owner:** Nafindo Group Product Team
**Developer:** Nafindo Group (www.nafindo.co.id)
**Version:** 4.0 Final
**Last Updated:** Juni 2026
**© 2026 Nafindo Group. All Rights Reserved.**
