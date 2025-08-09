import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/layouts';
import About from './about';
import CvGen from './cvgen';
import HowToUse from '@/components/how-to-use';

export default function Home() {
  return (
    <AppLayout>
      <Head title="CV Generator - create cv easier for free" />

      {/* CvGen Section */}
      <CvGen />

      {/* Spasi vertikal antara CvGen dan HowToUse */}
      <div className="py-16 md:py-24 lg:py-32"></div>

      {/* How to Use Section */}
      <HowToUse />

      {/* Spasi vertikal antara HowToUse dan About */}
      <div className="py-16 md:py-1 lg:py-1"></div>

      {/* About Section */}
      {/*    */}
    </AppLayout>
  );
}
