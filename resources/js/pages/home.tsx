import HowToUse from '@/components/how-to-use';
import AppLayout from '@/layouts/layouts';
import { Head } from '@inertiajs/react';
import CvGen from './cvgen';

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

            {/* About Section */}
            {/*    */}
        </AppLayout>
    );
}
