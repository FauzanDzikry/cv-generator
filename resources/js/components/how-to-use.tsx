import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
export default function HowToUse() {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;

    return (
        <>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes slideRight {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(6px); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-slide-right { animation: slideRight 2s ease-in-out infinite; }
                .fade-in-up {
                    opacity: 0;
                    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
            `}</style>
            {/* Section How to Use */}
            <section
                id="how-to-use"
                className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 md:py-24 lg:py-32 dark:from-gray-900 dark:to-gray-800"
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        {/* Header Section */}
                        <div className="mb-16 text-center fade-in-up delay-100">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50 dark:bg-red-900/30 dark:ring-red-900/20 animate-float shadow-sm cursor-default hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-300">
                                <svg className="h-7 w-7 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white cursor-default">How to Use CV Generator</h2>
                            <p className="mx-auto max-w-3xl text-lg text-gray-500 dark:text-gray-400 cursor-default">
                                Only 2 simple steps to create a professional CV that is ready to use
                            </p>
                        </div>

                        {/* Main Steps */}
                        <div className="relative mb-20">
                            <div className="relative flex flex-col items-stretch justify-center gap-8 lg:flex-row lg:items-center">
                                {/* Step 1 */}
                                <div className="group relative z-10 mx-auto w-full max-w-md cursor-pointer lg:w-1/2 fade-in-up delay-200">
                                    <div className="h-full rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(239,68,68,0.1)] sm:p-10 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none dark:hover:shadow-[0_20px_40px_rgb(239,68,68,0.05)]">
                                        <div className="mb-6 flex items-center space-x-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-500 shadow-sm transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:group-hover:bg-red-500 dark:group-hover:text-white">
                                                1
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-red-500 dark:text-white dark:group-hover:text-red-400">Fill the Form</h3>
                                        </div>
                                        <p className="mb-8 leading-relaxed text-gray-500 dark:text-gray-400">
                                            Complete all required information such as personal data, work experience, education, and skills with
                                            accurate details.
                                        </p>

                                        {/* Feature List */}
                                        <ul className="space-y-4">
                                            {['Complete personal data', 'Detailed work experience', 'Education and skills', 'Real-time preview'].map((text, i) => (
                                                <li key={i} className="flex items-center text-gray-600 transition-all duration-200 hover:translate-x-1 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
                                                    <div className="mr-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-50 transition-colors duration-300 group-hover:bg-red-100 dark:bg-red-900/30 dark:group-hover:bg-red-900/50">
                                                        <svg className="h-3.5 w-3.5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    {text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Arrow Connector */}
                                <div className="absolute left-1/2 top-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center lg:flex fade-in-up delay-300">
                                    <div className="flex h-12 w-12 animate-slide-right items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 shadow-md dark:border-gray-700 dark:bg-gray-800">
                                        <svg className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="group relative z-10 mx-auto w-full max-w-md cursor-pointer lg:w-1/2 fade-in-up delay-300">
                                    <div className="h-full rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(34,197,94,0.1)] sm:p-10 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none dark:hover:shadow-[0_20px_40px_rgb(34,197,94,0.05)]">
                                        <div className="mb-6 flex items-center space-x-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-xl font-bold text-green-500 shadow-sm transition-all duration-300 group-hover:-rotate-12 group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white dark:bg-green-900/30 dark:text-green-400 dark:group-hover:bg-green-500 dark:group-hover:text-white">
                                                2
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-green-500 dark:text-white dark:group-hover:text-green-400">Download CV</h3>
                                        </div>
                                        <p className="mb-8 leading-relaxed text-gray-500 dark:text-gray-400">
                                            Preview your CV and download it in PDF format, ready to use for job applications.
                                        </p>

                                        {/* Feature List */}
                                        <ul className="space-y-4">
                                            {['High quality PDF format', 'Preview before download', 'Ready to print and send', 'Free without limits'].map((text, i) => (
                                                <li key={i} className="flex items-center text-gray-600 transition-all duration-200 hover:translate-x-1 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400">
                                                    <div className="mr-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-50 transition-colors duration-300 group-hover:bg-green-100 dark:bg-green-900/30 dark:group-hover:bg-green-900/50">
                                                        <svg className="h-3.5 w-3.5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    {text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Login Feature Section */}
                        <div className="mx-auto w-full max-w-5xl rounded-[2.5rem] bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-red-50 dark:border-gray-700 md:p-12 dark:bg-gray-800 fade-in-up delay-200 relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 dark:bg-red-900/20 z-0 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                                {/* Left Content */}
                                <div className="w-full lg:w-1/2">
                                    <h3 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">Save & Manage Your CVs</h3>
                                    <p className="mb-8 text-base text-gray-600 md:text-lg dark:text-gray-300">
                                        Login to save, manage, and access all your created CVs anytime, anywhere.
                                    </p>
                                    
                                    <ul className="space-y-5 text-gray-700 dark:text-gray-300 font-medium">
                                        <li className="group flex cursor-pointer items-center gap-4 transition-all duration-300 hover:translate-x-2">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors duration-300 group-hover:bg-red-500 group-hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:group-hover:bg-red-500">
                                                <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <span className="transition-colors duration-300 group-hover:text-red-600 dark:group-hover:text-red-400">Access & edit your CVs from any device</span>
                                        </li>
                                        <li className="group flex cursor-pointer items-center gap-4 transition-all duration-300 hover:translate-x-2">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors duration-300 group-hover:bg-red-500 group-hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:group-hover:bg-red-500">
                                                <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <span className="transition-colors duration-300 group-hover:text-red-600 dark:group-hover:text-red-400">Easily manage multiple CVs</span>
                                        </li>
                                        <li className="group flex cursor-pointer items-center gap-4 transition-all duration-300 hover:translate-x-2">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors duration-300 group-hover:bg-red-500 group-hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:group-hover:bg-red-500">
                                                <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <span className="transition-colors duration-300 group-hover:text-red-600 dark:group-hover:text-red-400">Your CV data is safe and secure</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Right Content (CTA Box) */}
                                <div className="w-full lg:w-1/2">
                                    <div className="group overflow-hidden rounded-[2rem] bg-slate-50 p-8 sm:p-10 text-center border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 dark:bg-gray-900/50 dark:border-gray-700 relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-blue-900/10 dark:to-purple-900/10"></div>
                                        <div className="relative z-10">
                                            {isLoggedIn ? (
                                                <>
                                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 dark:bg-green-900/30 dark:text-green-400">
                                                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <p className="mb-8 text-lg font-medium text-slate-800 dark:text-gray-200">
                                                        You are already logged in. Start creating your CV now!
                                                    </p>
                                                    <a
                                                        href="#cvgen"
                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100"
                                                    >
                                                        <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                        Create CV Now
                                                    </a>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-500 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                        </svg>
                                                    </div>
                                                    <p className="mb-8 text-lg font-medium text-slate-800 dark:text-gray-200">
                                                        Login to save and manage your CVs!
                                                    </p>
                                                    <a
                                                        href="/login"
                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100"
                                                    >
                                                        <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                        </svg>
                                                        Login
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Tips Membuat CV */}
            <section className="bg-white py-16 md:py-20 dark:bg-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        {/* Tips Section */}
                        <div className="mb-12 text-center">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Tips to Make an Impressive CV</h3>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                Follow these tips to create a more attractive and professional CV
                            </p>
                        </div>

                        <div className="mb-12 grid gap-8 md:grid-cols-2">
                            {/* Tips Column 1 */}
                            <div className="space-y-6">
                                <div className="group flex cursor-pointer items-start space-x-4 rounded-xl bg-gray-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-md dark:bg-gray-700 dark:hover:bg-gray-600">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 transition-colors duration-300 group-hover:bg-blue-500 dark:bg-blue-900/30 dark:group-hover:bg-blue-500">
                                        <svg className="h-5 w-5 text-blue-600 transition-colors duration-300 group-hover:text-white dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="mb-1 font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">Use Clear Language</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Write your experience and skills in a way that is easy to understand and professional.
                                        </p>
                                    </div>
                                </div>

                                <div className="group flex cursor-pointer items-start space-x-4 rounded-xl bg-gray-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md dark:bg-gray-700 dark:hover:bg-gray-600">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 transition-colors duration-300 group-hover:bg-green-500 dark:bg-green-900/30 dark:group-hover:bg-green-500">
                                        <svg className="h-5 w-5 text-green-600 transition-colors duration-300 group-hover:text-white dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="mb-1 font-semibold text-gray-900 transition-colors duration-300 group-hover:text-green-700 dark:text-white dark:group-hover:text-green-300">Highlight Achievements</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Focus on results and achievements you have accomplished in previous jobs.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Column 2 */}
                            <div className="space-y-6">
                                <div className="group flex cursor-pointer items-start space-x-4 rounded-xl bg-gray-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-purple-50 hover:shadow-md dark:bg-gray-700 dark:hover:bg-gray-600">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 transition-colors duration-300 group-hover:bg-purple-500 dark:bg-purple-900/30 dark:group-hover:bg-purple-500">
                                        <svg className="h-5 w-5 text-purple-600 transition-colors duration-300 group-hover:text-white dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="mb-1 font-semibold text-gray-900 transition-colors duration-300 group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-300">Tailor to the Position</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Adjust your CV to the position you are applying for to increase relevance.
                                        </p>
                                    </div>
                                </div>

                                <div className="group flex cursor-pointer items-start space-x-4 rounded-xl bg-gray-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-red-50 hover:shadow-md dark:bg-gray-700 dark:hover:bg-gray-600">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 transition-colors duration-300 group-hover:bg-red-500 dark:bg-red-900/30 dark:group-hover:bg-red-500">
                                        <svg className="h-5 w-5 text-red-600 transition-colors duration-300 group-hover:text-white dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="mb-1 font-semibold text-gray-900 transition-colors duration-300 group-hover:text-red-700 dark:text-white dark:group-hover:text-red-300">Check Spelling</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Make sure there are no spelling or grammatical errors before sending your CV.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="relative overflow-hidden bg-slate-900 py-20 md:py-28">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -left-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-rose-500/10 blur-3xl"></div>
                    <div className="absolute -bottom-20 -right-20 h-64 w-64 animate-pulse rounded-full bg-blue-500/10 blur-3xl delay-700"></div>
                </div>
                <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center fade-in-up delay-100">
                        <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">Ready to Create a Professional CV?</h2>
                        <p className="mb-12 text-lg text-slate-400 md:text-xl">
                            Start now and create an impressive CV in minutes.
                        </p>
                        <a
                            href="#cvgen"
                            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-rose-600 px-10 py-4 text-lg font-bold text-white shadow-[0_0_40px_-5px_rgba(225,29,72,0.6)] transition-all duration-300 hover:-translate-y-1 hover:bg-rose-500 hover:shadow-[0_0_60px_-5px_rgba(225,29,72,0.8)]"
                        >
                            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="text-xl leading-none transition-transform duration-300 group-hover:rotate-90">+</span> Create CV Now
                            </span>
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
