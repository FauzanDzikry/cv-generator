import React from 'react';
import { useFormLocalStorage } from '../hooks/use-local-storage';

// Interface untuk data CV
interface CVData {
    name: string;
    email: string;
    phone: string;
    summary: string;
    skills: string;
}

// Data awal form
const initialFormData: CVData = {
    name: '',
    email: '',
    phone: '',
    summary: '',
    skills: ''
};

const SimplifiedAutoSaveForm: React.FC = () => {
    // Menggunakan custom hook untuk auto-save
    const {
        formData,
        updateField,
        resetForm,
        isFormEmpty,
        saveStatus
    } = useFormLocalStorage('simplified-cv-form', initialFormData);

    // Handle submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form data:', formData);
        alert('CV berhasil disimpan!');
    };

    // Render status indicator
    const renderSaveStatus = () => {
        switch (saveStatus) {
            case 'saving':
                return <span className="text-yellow-600 text-sm">💾 Menyimpan...</span>;
            case 'saved':
                return <span className="text-green-600 text-sm">✅ Tersimpan</span>;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    CV Builder - Auto Save
                </h2>
                <div className="flex items-center gap-3">
                    {renderSaveStatus()}
                    {!isFormEmpty() && (
                        <button
                            onClick={resetForm}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nama lengkap"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="nama@email.com"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor Telepon
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+62 812 3456 7890"
                    />
                </div>

                {/* Summary */}
                <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                        Ringkasan Profil
                    </label>
                    <textarea
                        id="summary"
                        rows={4}
                        value={formData.summary}
                        onChange={(e) => updateField('summary', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ceritakan sedikit tentang diri Anda..."
                    />
                </div>

                {/* Skills */}
                <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                        Keahlian
                    </label>
                    <textarea
                        id="skills"
                        rows={3}
                        value={formData.skills}
                        onChange={(e) => updateField('skills', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="JavaScript, React, Node.js, dll..."
                    />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isFormEmpty()}
                        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                            isFormEmpty()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                    >
                        {isFormEmpty() ? 'Isi form untuk melanjutkan' : 'Generate CV'}
                    </button>
                </div>
            </form>

            {/* Info */}
            <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-600">
                    💡 Data akan disimpan otomatis saat Anda mengetik. 
                    Refresh halaman untuk melihat data tetap tersimpan.
                </p>
            </div>
        </div>
    );
};

export default SimplifiedAutoSaveForm; 