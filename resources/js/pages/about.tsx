const About = () => {
    return (
        <section id="about" className="bg-gray-50 py-16 dark:bg-gray-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                        Tentang <span className="text-red-600">CV Generator</span>
                    </h2>
                    <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300">
                        Kami membuat pembuatan CV menjadi lebih mudah untuk semua orang
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-white p-6 shadow-md transition-transform hover:scale-105 dark:bg-gray-700">
                        <div className="mb-4 text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Cepat & Mudah</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Buat CV profesional hanya dalam beberapa menit dengan antarmuka yang mudah digunakan.
                        </p>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-md transition-transform hover:scale-105 dark:bg-gray-700">
                        <div className="mb-4 text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Sepenuhnya Gratis</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Nikmati semua fitur tanpa biaya tersembunyi. Kami percaya semua orang berhak mendapatkan CV yang bagus.
                        </p>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-md transition-transform hover:scale-105 dark:bg-gray-700">
                        <div className="mb-4 text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Desain Profesional</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Pilih dari berbagai template yang dirancang oleh profesional untuk membuat CV Anda menonjol.
                        </p>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <p className="mx-auto mb-6 max-w-3xl text-lg text-gray-700 dark:text-gray-300">
                        CV Generator dibuat untuk membantu pencari kerja membuat dokumen berkualitas tinggi dengan mudah tanpa perlu keahlian desain.
                    </p>
                    <a
                        href="/buat-cv"
                        className="inline-block rounded-md bg-red-600 px-8 py-3 font-medium text-white transition-all duration-300 hover:bg-red-700"
                    >
                        Buat CV Sekarang
                    </a>
                </div>
            </div>
        </section>
    );
};

export default About;
