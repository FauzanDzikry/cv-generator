import React, { useEffect, useState } from 'react';

// Interface untuk tipe data form CV
interface CVFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    summary: string;
    workExperience: string;
    education: string;
    skills: string;
}

// Kunci untuk localStorage
const STORAGE_KEY = 'cv-form-data';

const AutoSaveCVForm: React.FC = () => {
    // Fungsi untuk mendapatkan data awal dari localStorage
    const getInitialData = (): CVFormData => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error parsing saved form data:', error);
        }

        // Data default jika tidak ada data tersimpan atau error
        return {
            name: '',
            email: '',
            phone: '',
            address: '',
            summary: '',
            workExperience: '',
            education: '',
            skills: '',
        };
    };

    // State untuk menyimpan data form
    const [formData, setFormData] = useState<CVFormData>(getInitialData);

    // State untuk menunjukkan status auto-save
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

    // useEffect untuk menyimpan data ke localStorage setiap kali formData berubah
    useEffect(() => {
        // Debounce untuk menghindari terlalu sering menyimpan
        setSaveStatus('saving');

        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
                setSaveStatus('saved');

                // Reset status setelah 2 detik
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Error saving form data:', error);
                setSaveStatus('idle');
            }
        }, 500); // Delay 500ms sebelum menyimpan

        // Cleanup timeout jika component unmount atau formData berubah lagi
        return () => clearTimeout(timeoutId);
    }, [formData]);

    // Fungsi helper untuk mengupdate field tertentu
    const updateField = (field: keyof CVFormData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Fungsi untuk membersihkan form dan localStorage
    const clearForm = () => {
        const emptyData: CVFormData = {
            name: '',
            email: '',
            phone: '',
            address: '',
            summary: '',
            workExperience: '',
            education: '',
            skills: '',
        };
        setFormData(emptyData);
        localStorage.removeItem(STORAGE_KEY);
        setSaveStatus('idle');
    };

    // Fungsi untuk submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Di sini Anda bisa mengirim data ke server
        alert('CV berhasil disimpan!');
    };

    return (
        <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">CV Generator</h1>

                {/* Indikator status auto-save */}
                <div className="flex items-center gap-2">
                    {saveStatus === 'saving' && <span className="text-sm text-yellow-600">💾 Menyimpan...</span>}
                    {saveStatus === 'saved' && <span className="text-sm text-green-600">✅ Tersimpan otomatis</span>}
                    <button onClick={clearForm} className="rounded bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600">
                        Bersihkan Form
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informasi Personal */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan nama lengkap"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            placeholder="nama@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                            Nomor Telepon
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            placeholder="+62 812 3456 7890"
                        />
                    </div>

                    <div>
                        <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-700">
                            Alamat
                        </label>
                        <input
                            type="text"
                            id="address"
                            value={formData.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            placeholder="Kota, Provinsi"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div>
                    <label htmlFor="summary" className="mb-2 block text-sm font-medium text-gray-700">
                        Ringkasan Profil
                    </label>
                    <textarea
                        id="summary"
                        rows={4}
                        value={formData.summary}
                        onChange={(e) => updateField('summary', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="Ceritakan sedikit tentang diri Anda dan tujuan karir..."
                    />
                </div>

                {/* Pengalaman Kerja */}
                <div>
                    <label htmlFor="workExperience" className="mb-2 block text-sm font-medium text-gray-700">
                        Pengalaman Kerja
                    </label>
                    <textarea
                        id="workExperience"
                        rows={6}
                        value={formData.workExperience}
                        onChange={(e) => updateField('workExperience', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="Tuliskan pengalaman kerja Anda (posisi, perusahaan, periode, deskripsi)..."
                    />
                </div>

                {/* Pendidikan */}
                <div>
                    <label htmlFor="education" className="mb-2 block text-sm font-medium text-gray-700">
                        Pendidikan
                    </label>
                    <textarea
                        id="education"
                        rows={4}
                        value={formData.education}
                        onChange={(e) => updateField('education', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="Tuliskan riwayat pendidikan Anda..."
                    />
                </div>

                {/* Keahlian */}
                <div>
                    <label htmlFor="skills" className="mb-2 block text-sm font-medium text-gray-700">
                        Keahlian
                    </label>
                    <textarea
                        id="skills"
                        rows={3}
                        value={formData.skills}
                        onChange={(e) => updateField('skills', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="JavaScript, React, Node.js, dll..."
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Generate CV
                    </button>
                </div>
            </form>

            {/* Info tentang auto-save */}
            <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                    💡 <strong>Auto-Save:</strong> Data form Anda akan disimpan secara otomatis setiap kali Anda mengetik. Data akan tetap ada
                    meskipun Anda me-refresh halaman atau menutup browser.
                </p>
            </div>
        </div>
    );
};

export default AutoSaveCVForm;
