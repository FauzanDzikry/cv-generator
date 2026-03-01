import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function HowToUse() {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const [currentStep, setCurrentStep] = useState(0);

    // Auto-rotate through steps every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev === 0 ? 1 : 0));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Section How to Use */}
            <section id="how-to-use" className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Header Section */}
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                                How to Use CV Generator
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                                Only 2 simple steps to create a professional CV that is ready to use
                            </p>
                        </div>

                        {/* Main Steps with Flowchart Flow */}
                        <div className="relative mb-20">
                            {/* Step Flow Container */}
                            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                                {/* Step 1 */}
                                <div className={`relative group transition-all duration-700 ${currentStep === 0 ? 'scale-105 opacity-100' : 'scale-100 opacity-100'}`}>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full max-w-md">
                                        {/* Step Label */}
                                        <div className="absolute -top-4 -left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                                            1
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                            Fill the Form
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                            Complete all required information such as personal data, work experience, education, and skills with accurate details.
                                        </p>

                                        {/* Feature List */}
                                        <ul className="space-y-3">
                                            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Complete personal data
                                            </li>
                                            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Detailed work experience
                                            </li>
                                            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Education and skills
                                            </li>
                                            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Real-time preview
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Flowchart Connection Line */}
                                <div className="hidden lg:flex items-center justify-center relative">
                                    {/* Horizontal Line */}
                                    <div className={`h-2 bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all duration-1000 ${currentStep === 0 ? 'w-0' : 'w-32'}`}></div>
                                </div>

                                {/* Mobile Flowchart Connection */}
                                <div className="lg:hidden flex items-center justify-center my-4 relative">
                                    {/* Vertical Line */}
                                    <div className={`w-2 bg-gradient-to-b from-red-500 to-green-500 rounded-full transition-all duration-1000 ${currentStep === 0 ? 'h-0' : 'h-20'}`}></div>
                                </div>

                                {/* Step 2 */}
                                <div className={`relative group transition-all duration-700 ${currentStep === 1 ? 'scale-105 opacity-100' : 'scale-100 opacity-70'}`}>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full max-w-md">
                                        {/* Step Label */}
                                        <div className="absolute -top-4 -left-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                                            2
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                            Download CV
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                            Preview your CV and download it in PDF format, ready to use for job applications.
                                        </p>

                                        {/* Feature List */}
                                        <ul className="space-y-3">
                                            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                High quality PDF format
                                            </li>
                                            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Preview before download
                                            </li>
                                            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Ready to print and send
                                            </li>
                                            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Free without limits
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Step Indicators */}
                            <div className="flex justify-center mt-8 space-x-2">
                                <button
                                    onClick={() => setCurrentStep(0)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${currentStep === 0 ? 'bg-red-500 scale-125' : 'bg-gray-300 dark:bg-gray-600'}`}
                                />
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${currentStep === 1 ? 'bg-green-500 scale-125' : 'bg-gray-300 dark:bg-gray-600'}`}
                                />
                            </div>
                        </div>

                        {/* Login Feature Section */}
                        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-8 md:p-10 shadow-2xl max-w-2xl w-full mx-auto">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
                                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                    Save & Manage Your CVs
                                </h3>
                                <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
                                    Login to save, manage, and access all your created CVs anytime, anywhere.
                                </p>
                            </div>
                            <div>
                                <ul className="space-y-3 text-gray-600 dark:text-gray-300 text-base md:text-lg">
                                    <li className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Your CVs are automatically saved to your account
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Access & edit your CVs from any device
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Easily manage multiple CVs
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Your CV data is safe and secure
                                    </li>
                                </ul>
                            </div>

                            {/* Conditional CTA based on login status */}
                            <div className="text-center mt-8">
                                {isLoggedIn ? (
                                    <>
                                        <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm md:text-base">
                                            You are already logged in. Start creating your CV now!
                                        </p>
                                        <div className="flex justify-center">
                                            <a
                                                href="#cvgen"
                                                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Create CV Now
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm md:text-base">
                                            Don't have an account? Register for free now!
                                        </p>
                                        <div className="flex justify-center">
                                            <a
                                                href="/login"
                                                className="inline-flex items-center px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-300 text-base"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                </svg>
                                                Login with Google
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Tips Membuat CV */}
            <section className="py-16 md:py-20 bg-white dark:bg-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Tips Section */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                Tips to Make an Impressive CV
                            </h3>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                Follow these tips to create a more attractive and professional CV
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            {/* Tips Column 1 */}
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Use Clear Language</h4>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            Write your experience and skills in a way that is easy to understand and professional.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Highlight Achievements</h4>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            Focus on results and achievements you have accomplished in previous jobs.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Column 2 */}
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Tailor to the Position</h4>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            Adjust your CV to the position you are applying for to increase relevance.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Check Spelling</h4>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            Make sure there are no spelling or grammatical errors before sending your CV.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Call to Action */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Ready to Create a Professional CV?
                            </h3>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                Start now and create an impressive CV in minutes
                            </p>
                            <a
                                href="#cvgen"
                                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create CV Now
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
