import { Link } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';

export default function TermsAndConditions() {
  return (
    <div className="bg-surface-container-lowest text-on-surface min-h-screen font-body-md">
      <header className="border-b border-ui-divider bg-surface px-lg py-md flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-sm hover:opacity-80 transition-opacity">
          <img src={logoImg} alt="Buktiin Logo" className="w-8 h-8 rounded shadow-sm" />
          <span className="font-headline-md font-extrabold text-primary tracking-tighter">BUKTIIN</span>
        </Link>
        <Link to="/login" className="flex items-center gap-xs font-bold text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
          Kembali ke Login
        </Link>
      </header>
      
      <main className="max-w-4xl mx-auto py-2xl px-md">
        <div className="bg-surface border border-ui-divider rounded-xl p-lg md:p-xl shadow-sm space-y-lg">
          <div className="border-b border-ui-divider pb-md mb-lg">
            <h1 className="font-headline-lg font-bold text-primary mb-xs">Syarat & Ketentuan Penggunaan</h1>
            <p className="text-on-surface-variant font-code-sm">Pembaruan Terakhir: 2 Juli 2026</p>
          </div>

          <div className="space-y-md text-justify leading-relaxed">
            <p>
              Selamat datang di <strong>BUKTIIN</strong>, layanan perangkat lunak sistem perekaman resi pintar yang dikembangkan dan dikelola oleh <strong>Nafindo Group</strong> ("Kami", "Perusahaan"). Dengan mendaftar, mengakses, atau menggunakan aplikasi BUKTIIN ("Layanan"), Anda ("Pengguna", "Klien") secara tegas menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan Syarat dan Ketentuan ini, Anda tidak diperkenankan menggunakan Layanan.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">1. Definisi Layanan</h3>
            <p>
              BUKTIIN adalah *Software-as-a-Service* (SaaS) yang menyediakan fitur perekaman video proses *packing*, manajemen resi, dan integrasi *marketplace* untuk keperluan operasional gudang dan bukti penyelesaian pesanan.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">2. Tanggung Jawab dan Kewajiban Pengguna</h3>
            <ul className="list-disc pl-md space-y-sm">
              <li>Pengguna wajib memberikan informasi pendaftaran yang akurat dan menjaga kerahasiaan kredensial login (email dan password).</li>
              <li>Pengguna bertanggung jawab penuh atas segala aktivitas yang terjadi di bawah akun mereka.</li>
              <li>Pengguna dilarang menggunakan Layanan untuk tujuan ilegal, melanggar hukum hak cipta, atau mengunggah konten yang mengandung *malware*, ujaran kebencian, atau pelecehan.</li>
              <li>Pengguna harus mematuhi batas penyimpanan (*storage limits*) dan kuota pesanan sesuai dengan paket berlangganan yang dipilih.</li>
            </ul>

            <h3 className="font-headline-md font-bold mt-xl">3. Batasan Tanggung Jawab (Limitation of Liability)</h3>
            <p className="font-bold text-error">
              MOHON BACA BAGIAN INI DENGAN SEKSAMA KARENA MEMBATASI TANGGUNG JAWAB NAFINDO GROUP KEPADA ANDA.
            </p>
            <p>
              Layanan disediakan "SEBAGAIMANA ADANYA" (*as is*) dan "SEBAGAIMANA TERSEDIA" (*as available*). Nafindo Group secara tegas menolak semua jaminan, baik tersurat maupun tersirat. 
            </p>
            <p>
              Sejauh diizinkan oleh hukum yang berlaku, <strong>Nafindo Group tidak akan pernah bertanggung jawab</strong> atas setiap kerugian tidak langsung, insidental, khusus, konsekuensial, atau hukuman, atau hilangnya keuntungan maupun pendapatan, baik yang terjadi secara langsung atau tidak langsung, atau setiap hilangnya data, penggunaan, niat baik, atau kerugian tak wujud lainnya, yang diakibatkan oleh:
            </p>
            <ul className="list-disc pl-md space-y-sm">
              <li>Akses atau penggunaan Anda ke, atau ketidakmampuan Anda untuk mengakses atau menggunakan Layanan.</li>
              <li>Kegagalan fungsi perangkat keras (*hardware*), kamera, atau koneksi internet di lokasi fasilitas Anda.</li>
              <li>Akses, penggunaan, atau perubahan yang tidak sah dari transmisi atau konten Pengguna.</li>
              <li>Penolakan klaim dari pihak *marketplace* atau kurir logistik yang Anda ajukan meskipun menggunakan rekaman dari BUKTIIN.</li>
            </ul>

            <h3 className="font-headline-md font-bold mt-xl">4. Pembayaran, Berlangganan, dan Penghentian (Termination)</h3>
            <p>
              Layanan ditawarkan dalam berbagai paket berlangganan. Kami berhak mengubah harga kapan saja, namun perubahan tidak akan berlaku pada periode penagihan yang sedang aktif. 
            </p>
            <p>
              Nafindo Group berhak untuk <strong>menangguhkan atau mengakhiri akun Anda secara sepihak dan seketika</strong> tanpa pemberitahuan sebelumnya atau kewajiban finansial apapun jika Anda melanggar Syarat dan Ketentuan ini, atau menggunakan Layanan dengan cara yang menyebabkan tanggung jawab hukum bagi Kami.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">5. Hak Kekayaan Intelektual</h3>
            <p>
              Semua kode sumber, desain antarmuka, algoritma, merek dagang "BUKTIIN", dan logo merupakan hak kekayaan intelektual eksklusif milik Nafindo Group. Pengguna dilarang menyalin, merekayasa balik (*reverse engineering*), atau memodifikasi perangkat lunak ini.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">6. Hukum yang Berlaku</h3>
            <p>
              Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia, tanpa memperhatikan pertentangan ketentuan hukum. Setiap perselisihan yang timbul akan diselesaikan di pengadilan yang memiliki yurisdiksi di wilayah operasional Nafindo Group.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center py-lg text-on-surface-variant font-code-sm border-t border-ui-divider mt-xl">
        © 2026 Nafindo Group. Hak Cipta Dilindungi Undang-Undang.
      </footer>
    </div>
  );
}
