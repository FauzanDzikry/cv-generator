import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/layouts';

export default function Home() {
  const navItems = [
    { title: 'Beranda', href: '/' },
    { title: 'Tentang', href: '/tentang' },
    { title: 'Layanan', href: '/layanan' },
    { title: 'Kontak', href: '/kontak' }
  ];

  return (
    <AppLayout navItems={navItems}>
      <Head title="CV Generator - create cv easier for free" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              <h1 className="text-3xl font-bold mb-6">Selamat Datang di CV Generator</h1>
              
              <p className="mb-4">
                Aplikasi ini membantu Anda membuat CV profesional dengan mudah dan cepat.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-3">Buat CV</h2>
                  <p className="mb-4">Mulai membuat CV baru dengan template yang tersedia.</p>
                  <a href="/buat-cv" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Mulai Sekarang
                  </a>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-3">Template</h2>
                  <p className="mb-4">Pilih dari berbagai template CV profesional.</p>
                  <a href="/template" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Lihat Template
                  </a>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-3">Bantuan</h2>
                  <p className="mb-4">Pelajari cara menggunakan aplikasi CV Generator.</p>
                  <a href="/bantuan" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Baca Panduan
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
