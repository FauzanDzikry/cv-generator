import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/layouts';
import About from './about';
import CvGen from './cvgen';

export default function Home() {
  return (
    <AppLayout>
      <Head title="CV Generator - create cv easier for free" />

      {/* CvGen Section */}
      <CvGen />

      {/* Spasi vertikal antara CvGen dan About */}
      <div className="py-16 md:py-24 lg:py-32"></div>

      {/* About Section */}
      {/*    */}
    </AppLayout>
  );
}
