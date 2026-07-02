import { Link } from 'react-router-dom';
import logoImg from '../assets/images/logo.jpg';

export default function PrivacyPolicy() {
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
            <h1 className="font-headline-lg font-bold text-primary mb-xs">Kebijakan Privasi</h1>
            <p className="text-on-surface-variant font-code-sm">Pembaruan Terakhir: 2 Juli 2026</p>
          </div>

          <div className="space-y-md text-justify leading-relaxed">
            <p>
              Di <strong>Nafindo Group</strong> ("Kami", "Perusahaan"), Kami memprioritaskan keamanan dan privasi data Anda. Kebijakan Privasi ini menjelaskan bagaimana Kami mengumpulkan, menggunakan, menyimpan, dan membagikan informasi saat Anda menggunakan aplikasi BUKTIIN ("Layanan"). Dengan menggunakan Layanan ini, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan kebijakan ini.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">1. Informasi yang Kami Kumpulkan</h3>
            <p>Kami dapat mengumpulkan jenis informasi berikut saat Anda berinteraksi dengan Layanan:</p>
            <ul className="list-disc pl-md space-y-sm">
              <li><strong>Data Akun:</strong> Alamat email, kata sandi (dienkripsi), nama lengkap, dan nomor telepon.</li>
              <li><strong>Data Operasional Gudang:</strong> Informasi terkait resi, nama kurir, detail pelanggan pembeli (nama, nomor telepon, dan alamat yang tercetak di resi) yang Anda pindai ke dalam sistem.</li>
              <li><strong>Data Media:</strong> Rekaman video *packing* dan bukti fisik yang diambil melalui perangkat kamera yang terhubung dengan aplikasi BUKTIIN.</li>
              <li><strong>Data Telemetri & Log:</strong> Alamat IP, jenis peramban, waktu akses, dan aktivitas dalam aplikasi untuk keperluan *debugging* dan peningkatan kinerja layanan.</li>
            </ul>

            <h3 className="font-headline-md font-bold mt-xl">2. Bagaimana Kami Menggunakan Informasi Anda</h3>
            <p>Informasi yang terkumpul semata-mata digunakan untuk tujuan operasional dan peningkatan Layanan BUKTIIN, meliputi:</p>
            <ul className="list-disc pl-md space-y-sm">
              <li>Menyediakan infrastruktur penyimpanan video bukti *packing* yang dapat Anda rujuk kembali saat terjadi klaim retur atau komplain dari pelanggan Anda.</li>
              <li>Menjalankan sinkronisasi status pesanan dan penarikan detail otomatis dari API *marketplace* (Shopee, Tokopedia, dll) atas seizin Anda.</li>
              <li>Memberikan *customer support*, menyelesaikan *troubleshooting*, dan menjaga keamanan *server* dari aktivitas penipuan.</li>
            </ul>
            <p className="font-bold text-primary">
              Nafindo Group tidak akan pernah menjual, menyewakan, atau mendistribusikan data pembeli atau video gudang Anda kepada pihak ketiga untuk kepentingan pemasaran pihak lain.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">3. Keamanan dan Penyimpanan Data</h3>
            <p>
              Kami mengimplementasikan standar keamanan industri yang ketat, termasuk enkripsi *in-transit* (HTTPS/SSL) dan *at-rest* untuk melindungi basis data Anda (yang dikelola menggunakan arsitektur *cloud* berstandar tinggi seperti Supabase/AWS). Akses ke data rekaman video Anda dibatasi secara ketat oleh *Row Level Security* (RLS) sehingga hanya Anda dan *sub-account* yang Anda otorisasi yang dapat melihat rekaman tersebut.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">4. Kepatuhan Hukum & Privasi Subjek Data (UU PDP)</h3>
            <p>
              Dalam konteks Undang-Undang Pelindungan Data Pribadi (UU PDP) Republik Indonesia, Anda bertindak sebagai <strong>Pengendali Data Pribadi</strong> atas data pembeli/konsumen Anda, sedangkan Nafindo Group murni bertindak sebagai <strong>Prosesor Data Pribadi</strong> yang hanya menyediakan infrastruktur perangkat lunak. Anda diwajibkan untuk memastikan bahwa Anda memiliki dasar hukum yang sah (misalnya persetujuan) dari konsumen Anda sebelum memasukkan data mereka ke dalam BUKTIIN. Nafindo Group terlepas dari segala tuntutan hukum yang timbul akibat kelalaian Anda sebagai Pengendali Data.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">5. Perubahan pada Kebijakan Ini</h3>
            <p>
              Kami berhak mengubah atau merevisi Kebijakan Privasi ini sewaktu-waktu tanpa pemberitahuan sebelumnya yang bersifat mutlak, namun Kami akan mengupayakan untuk menginformasikan setiap perubahan material melalui *dashboard* aplikasi. Kelanjutan penggunaan Layanan setelah perubahan berlaku dianggap sebagai persetujuan Anda terhadap Kebijakan Privasi yang baru.
            </p>

            <h3 className="font-headline-md font-bold mt-xl">6. Hubungi Kami</h3>
            <p>
              Jika Anda memiliki pertanyaan mendetail atau kekhawatiran terkait pengelolaan privasi data Anda, silakan hubungi tim keamanan dan privasi Nafindo Group di: <strong>legal@nafindo.com</strong> atau <strong>privacy-officer@buktiin.id</strong>.
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
