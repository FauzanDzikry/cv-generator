import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/layouts';
import FormProgress from '@/components/percentage';
import CV from '@/components/cv-format';

export default function CvForm() {
    // State untuk form
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        linkedin: '',
        summary: '',
        photo: null as File | null,
        is_use_photo: false,
        work_experience: [{
            company: '',
            company_location: '',
            position: '',
            location_type: '',
            start_date: '',
            end_date: '',
            description: '',
            is_current: false
        }],
        education: [{
            institution: '',
            degree: '',
            field: '',
            start_date: '',
            end_date: '',
            description: ''
        }],
        skills: [{
            name: ''
        }],
        portfolios: [{
            title: '',
            link: '',
            description: ''
        }],
        certifications: [{
            name: '',
            organization: '',
            start_year: '',
            end_year: '',
            is_time_limited: false,
            description: '',
            credential_id: ''
        }],
        languages: [{
            language: '',
            level: ''
        }],
        accomplishments: [{
            description: ''
        }],
        organizations: [{
            name: '',
            position: '',
            start_date: '',
            end_date: '',
            is_current: false,
            description: ''
        }],
        additional_info: '',
    });

    // State untuk preview
    const [showPreview, setShowPreview] = useState(false);
    // State untuk animasi
    const [pageLoaded, setPageLoaded] = useState(false);
    // State untuk add-on
    const [addOnSections, setAddOnSections] = useState({
        portfolios: false,
        certifications: false,
        accomplishments: false,
        organizations: false,
        languages: false,
        additional_info: false
    });
    // State untuk preview foto
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const fieldGroups = {
        personal: {
            label: 'Personal Information',
            fields: ['name', 'address', 'phone', 'email', 'linkedin', 'summary', 'photo', 'is_use_photo'],
            requiredFields: ['name', 'address', 'phone', 'email', 'summary']
        },
        work_experience: {
            label: 'Work Experience',
            fields: ['company', 'company_location', 'location_type', 'position', 'start_date', 'end_date', 'description'],
            isArray: true,
            requiredFields: ['company', 'company_location', 'location_type', 'position', 'start_date', 'end_date', 'description']
        },
        education: {
            label: 'Education',
            fields: ['institution', 'degree', 'field', 'start_date', 'end_date', 'description'],
            isArray: true,
            requiredFields: ['institution', 'start_date', 'end_date', 'field']
        },
        skills: {
            label: 'Skills',
            fields: ['name'],
            isArray: true,
            requiredFields: ['name']
        },
        portfolios: {
            label: 'Portfolios',
            fields: ['title', 'link', 'description'],
            isArray: true,
            requiredFields: ['title', 'link', 'description']
        },
        accomplishments: {
            label: 'Accomplishments',
            fields: ['description'],
            isArray: true,
            requiredFields: ['description']
        },
        certifications: {
            label: 'Certifications',
            fields: ['name', 'organization', 'start_year', 'end_year', 'description', 'credential_id'],
            isArray: true,
            requiredFields: ['name', 'organization', 'start_year']
        },
        languages: {
            label: 'Languages',
            fields: ['language', 'level'],
            isArray: true,
            requiredFields: ['language', 'level']
        },
        organizations: {
            label: 'Organizations',
            fields: ['name', 'position', 'start_date', 'end_date', 'description'],
            isArray: true,
            requiredFields: ['name', 'position', 'start_date', 'description']
        },
        additional_info: {
            label: 'Additional Information',
            fields: ['additional_info'],
            requiredFields: ['additional_info']
        }
    };
    const [formTouched, setFormTouched] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setPageLoaded(true);
        }, 100);

        if (!formTouched && (
            formData.name || formData.email || formData.phone ||
            formData.work_experience.some(exp => exp.company || exp.position) ||
            formData.education.some(edu => edu.institution || edu.degree) ||
            formData.skills.length > 0
        )) {
            setFormTouched(true);
        }
    }, [formData, formTouched]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData({
            ...formData,
            [name]: checked
        });
    };

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validasi tipe file
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, JPG)');
                return;
            }
            
            // Simpan file ke state
            setFormData({
                ...formData,
                photo: file
            });
            
            // Buat URL untuk preview dengan rasio 3x4
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    if (ctx) {
                        let width, height;
                        const targetRatio = 3/4; // rasio 3:4
                        
                        if (img.width / img.height > targetRatio) {
                            height = img.height;
                            width = height * targetRatio;
                        } else {
                            width = img.width;
                            height = width / targetRatio;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Posisi gambar di tengah canvas
                        const offsetX = (img.width - width) / 2;
                        const offsetY = (img.height - height) / 2;
                        
                        ctx.drawImage(
                            img, 
                            offsetX, offsetY, width, height, 
                            0, 0, width, height
                        );
                        
                        // Konversi canvas ke URL data
                        const dataUrl = canvas.toDataURL(file.type);
                        setPhotoPreview(dataUrl);
                    } else {
                        // Fallback jika canvas tidak didukung
                        setPhotoPreview(reader.result as string);
                    }
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleArrayChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, index: number, arrayName: keyof typeof formData) => {
        const { name, value } = e.target;
        const updatedArray = [...formData[arrayName] as any[]];
        updatedArray[index] = {
            ...updatedArray[index],
            [name]: value
        };

        setFormData({
            ...formData,
            [arrayName]: updatedArray
        });
    };

    const addArrayItem = (arrayName: keyof typeof formData, emptyItem: any) => {
        const currentArray = [...(formData[arrayName] as any[])] as any[];
        setFormData({
            ...formData,
            [arrayName]: [...currentArray, emptyItem]
        });
    };

    const removeArrayItem = (arrayName: keyof typeof formData, index: number) => {
        const updatedArray = [...formData[arrayName] as any[]];
        updatedArray.splice(index, 1);

        setFormData({
            ...formData,
            [arrayName]: updatedArray
        });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Form data:', formData);
    };

    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    // Handler untuk checkbox add-on sections
    const handleAddOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setAddOnSections({
            ...addOnSections,
            [name]: checked
        });

        // Reset data ketika checkbox unchecked
        if (!checked) {
            // Reset data berdasarkan jenis add-on
            switch (name) {
                case 'portfolios':
                    setFormData({
                        ...formData,
                        portfolios: [{
                            title: '',
                            link: '',
                            description: ''
                        }]
                    });
                    break;
                case 'certifications':
                    setFormData({
                        ...formData,
                        certifications: [{
                            name: '',
                            organization: '',
                            start_year: '',
                            end_year: '',
                            is_time_limited: false,
                            description: '',
                            credential_id: ''
                        }]
                    });
                    break;
                case 'accomplishments':
                    setFormData({
                        ...formData,
                        accomplishments: [{
                            // title: '',
                            // date: '',
                            description: ''
                        }]
                    });
                    break;
                case 'organizations':
                    setFormData({
                        ...formData,
                        organizations: [{
                            name: '',
                            position: '',
                            start_date: '',
                            end_date: '',
                            is_current: false,
                            description: ''
                        }]
                    });
                    break;
                case 'languages':
                    setFormData({
                        ...formData,
                        languages: [{
                            language: '',
                            level: ''
                        }]
                    });
                    break;
                case 'additional_info':
                    setFormData({
                        ...formData,
                        additional_info: ''
                    });
                    break;
            }
        }
    };

    return (
        <AppLayout>
            <Head title="Form - CV Generator" />

            <div className="py-8 md:py-16 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="mb-8 text-center transition-all duration-700"
                        style={{
                            opacity: pageLoaded ? 1 : 0,
                            transform: `translateY(${pageLoaded ? 0 : 50}px)`
                        }}
                    >
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Create Your <span className="text-red-600">Professional CV</span>
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                            Complete the following form to create a professional CV
                        </p>
                    </div>

                    <div
                        className="flex flex-col md:flex-row gap-6 transition-all duration-700"
                        style={{
                            opacity: pageLoaded ? 1 : 0,
                            transform: `translateY(${pageLoaded ? 0 : 50}px)`,
                            transitionDelay: '0.2s'
                        }}
                    >
                        {/* Form Section */}
                        <div className={`${showPreview ? 'md:w-1/2' : 'w-full'} transition-all duration-300`}>
                            <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
                                {/* Tombol Preview */}
                                <div className="flex justify-end mb-4">
                                    <button
                                        type="button"
                                        onClick={togglePreview}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-500 active:bg-red-700 focus:outline-none focus:border-red-700 focus:ring ring-red-300 disabled:opacity-25 transition"
                                    >
                                        {showPreview ? 'Tutup Preview' : 'Preview CV'}
                                    </button>
                                </div>

                                {/* Komponen Progress Form */}
                                {formTouched && (
                                    <FormProgress
                                        formData={formData}
                                        fieldGroups={fieldGroups}
                                        addOnSections={addOnSections}
                                    />
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Personal Information */}
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                            Personal Information
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="mb-4">
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Full Name <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Email <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    placeholder="eg: example@gmail.com"
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Phone Number <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    placeholder="eg: +628123456789"
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    LinkedIn (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="linkedin"
                                                    name="linkedin"
                                                    value={formData.linkedin}
                                                    placeholder="linkedin.com/in/your-name"
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                                Address <span className="text-red-600">*</span>
                                                <div className="relative ml-1 group">
                                                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                        Recommendation: To protect your personal information, specify only your city and country rather than providing a complete address.
                                                    </div>
                                                </div>
                                            </label>
                                            <input
                                                type="text"
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                placeholder="eg: Central Jakarta, Indonesia"
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Summary <span className="text-red-600">*</span>
                                            </label>
                                            <textarea
                                                id="summary"
                                                name="summary"
                                                value={formData.summary}
                                                placeholder="Summarize your professional identity, notable expertise, and where you're headed in your career (50-100 words)"
                                                onChange={handleChange}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                        e.preventDefault();
                                                        const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                        setFormData({
                                                            ...formData,
                                                            summary: updatedValue
                                                        });
                                                    }
                                                }}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex items-center mb-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_use_photo"
                                                    name="is_use_photo"
                                                    checked={formData.is_use_photo}
                                                    onChange={handleCheckboxChange}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="is_use_photo" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Include Profile Photo
                                                </label>
                                            </div>
                                            
                                            {formData.is_use_photo && (
                                                <div>
                                                    <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Profile Photo
                                                    </label>
                                                    <div className="flex items-start space-x-4">
                                                        <div className="flex-1">
                                                            <input
                                                                type="file"
                                                                id="photo"
                                                                name="photo"
                                                                accept="image/png, image/jpeg, image/jpg"
                                                                onChange={handlePhotoChange}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            />
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                Accepted formats: JPG, JPEG, PNG. Max size: 2MB
                                                            </p>
                                                        </div>
                                                        {photoPreview && (
                                                            <div className="flex-shrink-0">
                                                                <div className="relative h-32 w-32 overflow-hidden rounded-full border border-gray-300 dark:border-gray-600">
                                                                    <img 
                                                                        src={photoPreview} 
                                                                        alt="Profile preview" 
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setPhotoPreview(null);
                                                                            setFormData({
                                                                                ...formData,
                                                                                photo: null
                                                                            });
                                                                        }}
                                                                        className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-md p-1"
                                                                        title="Remove photo"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                                                                    Profile photo
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Work Experience */}
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                            Work Experience
                                            <span className="ml-1 inline-flex items-center">
                                                <div className="relative ml-1 group">
                                                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                        Pro tip: Always arrange work experience with your current/most recent position at the first
                                                    </div>
                                                </div>
                                            </span>
                                        </h2>

                                        {formData.work_experience.map((exp, index) => (
                                            <div key={index} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                                <div className="flex justify-between mb-2">
                                                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                        Experience #{index + 1}
                                                    </h3>
                                                    {formData.work_experience.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeArrayItem('work_experience', index)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Company <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="company"
                                                            value={exp.company}
                                                            onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Company Location <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="company_location"
                                                            value={exp.company_location}
                                                            placeholder="eg: Central Jakarta"
                                                            onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Position <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="position"
                                                            value={exp.position}
                                                            placeholder="eg: Software Engineer"
                                                            onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Location Type <span className="text-red-600">*</span>
                                                        </label>
                                                        <select
                                                            name="location_type"
                                                            value={exp.location_type}
                                                            onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        >
                                                            <option value="">Please select</option>
                                                            <option value="On-site">On-site</option>
                                                            <option value="Hybrid">Hybrid</option>
                                                            <option value="Remote">Remote</option>
                                                        </select>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Start Date <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="month"
                                                            name="start_date"
                                                            value={exp.start_date}
                                                            onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            End Date <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="month"
                                                            name="end_date"
                                                            value={exp.end_date}
                                                            onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white ${exp.is_current ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}`}
                                                            required={!exp.is_current}
                                                            disabled={exp.is_current}
                                                        />
                                                        {exp.is_current && (
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                I am currently working in this role
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="mb-3 flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`is_current_${index}`}
                                                            name="is_current"
                                                            checked={exp.is_current || false}
                                                            onChange={(e) => {
                                                                const newWorkExperience = [...formData.work_experience];
                                                                newWorkExperience[index] = {
                                                                    ...newWorkExperience[index],
                                                                    is_current: e.target.checked
                                                                };
                                                                
                                                                // Jika checkbox dicentang, hapus nilai end_date
                                                                if (e.target.checked) {
                                                                    newWorkExperience[index].end_date = '';
                                                                }
                                                                
                                                                setFormData({
                                                                    ...formData,
                                                                    work_experience: newWorkExperience
                                                                });
                                                            }}
                                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`is_current_${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                            I am currently working in this role
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Description <span className="text-red-600">*</span>
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        value={exp.description}
                                                        placeholder="Describe your key responsibilities, achievements, and skills gained in this role (use bullet points for better readability)"
                                                        onChange={(e) => handleArrayChange(e, index, 'work_experience')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                e.preventDefault();
                                                                const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                const updatedArray = [...formData.work_experience];
                                                                updatedArray[index] = {
                                                                    ...updatedArray[index],
                                                                    description: updatedValue
                                                                };
                                                                setFormData({
                                                                    ...formData,
                                                                    work_experience: updatedArray
                                                                });
                                                            }
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => addArrayItem('work_experience', {
                                                company: '',
                                                company_location: '',
                                                position: '',
                                                location_type: '',
                                                start_date: '',
                                                end_date: '',
                                                description: '',
                                                is_current: false
                                            })}
                                            className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Add Work Experience
                                        </button>
                                    </div>

                                    {/* Education */}
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                            Education
                                            <span className="ml-1 inline-flex items-center">
                                                <div className="relative ml-1 group">
                                                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                        Pro tip: List your education in reverse chronological order (most recent degree first)
                                                    </div>
                                                </div>
                                            </span>
                                        </h2>

                                        {formData.education.map((edu, index) => (
                                            <div key={index} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                                <div className="flex justify-between mb-2">
                                                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                        Education #{index + 1}
                                                    </h3>
                                                    {formData.education.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeArrayItem('education', index)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Institution <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="institution"
                                                            value={edu.institution}
                                                            placeholder="eg: University of Indonesia"
                                                            onChange={(e) => handleArrayChange(e, index, 'education')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Degree
                                                        </label>
                                                        <select
                                                            name="degree"
                                                            value={edu.degree}
                                                            onChange={(e) => handleArrayChange(e, index, 'education')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                        >
                                                            <option value="">Please select</option>
                                                            <option value="Doctoral Degree">Doctoral Degree (PhD)</option>
                                                            <option value="Master's Degree">Master's Degree</option>
                                                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                                                            <option value="Associate Degree">Associate Degree</option>
                                                            <option value="Professional Certification">Professional Certification</option>
                                                            <option value="High School Diploma">High School Diploma</option>
                                                            <option value="Vocational School">Vocational School</option>
                                                            <option value="Middle School">Middle School</option>
                                                            <option value="Elementary School">Elementary School</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Field of Study <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="field"
                                                            value={edu.field || ''}
                                                            placeholder="eg: Computer Science"
                                                            onChange={(e) => handleArrayChange(e, index, 'education')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Start Date <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="month"
                                                            name="start_date"
                                                            value={edu.start_date}
                                                            onChange={(e) => handleArrayChange(e, index, 'education')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            End Date (or expected) <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                            type="month"
                                                            name="end_date"
                                                            value={edu.end_date}
                                                            onChange={(e) => handleArrayChange(e, index, 'education')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                                        Description <span className="text-red-600">*</span>
                                                        <div className="relative ml-1 group">
                                                            <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                                Pro tip :
                                                                <ul className="mt-1 pl-4 list-disc">
                                                                    <li>Only include GPA if it's impressive (typically 3.5/4.0 or higher)</li>
                                                                    <li>Include relevant coursework and academic projects that showcase skills applicable to the job</li>
                                                                    <li>Mention academic honors, scholarships, or awards to highlight your achievements</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        value={edu.description}
                                                        placeholder="GPA, Academic achievements, Relevant coursework, Honors, Scholarships, etc."
                                                        onChange={(e) => handleArrayChange(e, index, 'education')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                e.preventDefault();
                                                                const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                const updatedArray = [...formData.education];
                                                                updatedArray[index] = {
                                                                    ...updatedArray[index],
                                                                    description: updatedValue
                                                                };
                                                                setFormData({
                                                                    ...formData,
                                                                    education: updatedArray
                                                                });
                                                            }
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => addArrayItem('education', {
                                                institution: '',
                                                degree: '',
                                                field: '',
                                                start_date: '',
                                                end_date: '',
                                                description: ''
                                            })}
                                            className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Add Education
                                        </button>
                                    </div>

                                    {/* Skills */}
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                            Skills
                                            <span className="ml-1 inline-flex items-center">
                                                <div className="relative ml-1 group">
                                                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                        Pro tip: List your skills from the most relevant first
                                                    </div>
                                                </div>
                                            </span>
                                        </h2>

                                        {formData.skills.map((skill, index) => (
                                            <div key={index} className="mb-4 flex items-center space-x-4">
                                                <div className="flex-grow">
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={skill.name}
                                                        placeholder="eg: JavaScript"
                                                        onChange={(e) => handleArrayChange(e, index, 'skills')}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    />
                                                </div>

                                                {formData.skills.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArrayItem('skills', index)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => addArrayItem('skills', { name: '' })}
                                            className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Add Skill
                                        </button>
                                    </div>

                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                            Add-ons
                                            <span className="ml-1 inline-flex items-center">
                                                <div className="relative ml-1 group">
                                                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                        Select which additional sections to include in your CV
                                                    </div>
                                                </div>
                                            </span>
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="portfolios"
                                                    name="portfolios"
                                                    checked={addOnSections.portfolios}
                                                    onChange={handleAddOnChange}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="portfolios" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Portfolio
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="certifications"
                                                    name="certifications"
                                                    checked={addOnSections.certifications}
                                                    onChange={handleAddOnChange}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="certifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Licenses & Certifications
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="accomplishments"
                                                    name="accomplishments"
                                                    checked={addOnSections.accomplishments}
                                                    onChange={handleAddOnChange}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="accomplishments" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Accomplishments
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="organizations"
                                                    name="organizations"
                                                    checked={addOnSections.organizations}
                                                    onChange={handleAddOnChange}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="organizations" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Organizations
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="languages"
                                                    name="languages"
                                                    checked={addOnSections.languages}
                                                    onChange={handleAddOnChange}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="languages" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Languages
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="additional_info"
                                                    name="additional_info"
                                                    checked={addOnSections.additional_info}
                                                    onChange={handleAddOnChange}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="additional_info" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Additional Information
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1. Portfolio section - muncul jika checkbox dicentang */}
                                    {addOnSections.portfolios && (
                                        <div className="mb-8">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                                Portfolio
                                                <span className="ml-1 inline-flex items-center">
                                                    <div className="relative ml-1 group">
                                                        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                            Include your best projects, websites, apps, or other work samples that showcase your skills
                                                        </div>
                                                    </div>
                                                </span>
                                            </h2>

                                            {formData.portfolios.map((portfolio, index) => (
                                                <div key={index} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                                    <div className="flex justify-between mb-2">
                                                        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                            Portfolio Item #{index + 1}
                                                        </h3>
                                                        {formData.portfolios.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArrayItem('portfolios', index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Project Title <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="title"
                                                                value={portfolio.title}
                                                                placeholder="eg: E-commerce app"
                                                                onChange={(e) => handleArrayChange(e, index, 'portfolios')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Link
                                                            </label>
                                                            <input
                                                                type="url"
                                                                name="link"
                                                                value={portfolio.link}
                                                                placeholder="eg: example.com"
                                                                onChange={(e) => handleArrayChange(e, index, 'portfolios')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Description <span className="text-red-600">*</span>
                                                        </label>
                                                        <textarea
                                                            name="description"
                                                            value={portfolio.description}
                                                            placeholder="Describe the project, your role, technologies used, and key accomplishments"
                                                            onChange={(e) => handleArrayChange(e, index, 'portfolios')}
                                                            onKeyDown={(e) => {
                                                                if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                    e.preventDefault();
                                                                    const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                    const updatedArray = [...formData.portfolios];
                                                                    updatedArray[index] = {
                                                                        ...updatedArray[index],
                                                                        description: updatedValue
                                                                    };
                                                                    setFormData({
                                                                        ...formData,
                                                                        portfolios: updatedArray
                                                                    });
                                                                }
                                                            }}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addArrayItem('portfolios', {
                                                    title: '',
                                                    link: '',
                                                    description: ''
                                                })}
                                                className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                                Add Portfolio Item
                                            </button>
                                        </div>
                                    )}

                                    {/* 2. Certifications section - muncul jika checkbox dicentang */}
                                    {addOnSections.certifications && (
                                        <div className="mb-8">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                                Licenses & Certifications
                                            </h2>

                                            {formData.certifications.map((cert, index) => (
                                                <div key={index} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                                    <div className="flex justify-between mb-2">
                                                        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                            Certification #{index + 1}
                                                        </h3>
                                                        {formData.certifications.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArrayItem('certifications', index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Name <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={cert.name}
                                                                placeholder="e.g. AWS Certified Solutions Architect"
                                                                onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Issuing Organization <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="organization"
                                                                value={cert.organization}
                                                                placeholder="e.g. Amazon Web Services"
                                                                onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Issue Date <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="month"
                                                                name="start_year"
                                                                value={cert.start_year}
                                                                onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Expiration Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                name="end_year"
                                                                value={cert.end_year}
                                                                onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white ${!cert.is_time_limited ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}`}
                                                                disabled={!cert.is_time_limited}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mb-3 flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`is_time_limited_${index}`}
                                                            name="is_time_limited"
                                                            checked={cert.is_time_limited || false}
                                                            onChange={(e) => {
                                                                const newCertifications = [...formData.certifications];
                                                                newCertifications[index] = {
                                                                    ...newCertifications[index],
                                                                    is_time_limited: e.target.checked
                                                                };
                                                                setFormData({
                                                                    ...formData,
                                                                    certifications: newCertifications
                                                                });
                                                            }}
                                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`is_time_limited_${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                            This certification has an expiration date
                                                        </label>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Credential ID
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="credential_id"
                                                            value={cert.credential_id}
                                                            placeholder="e.g. AWS-1234567890"
                                                            onChange={(e) => handleArrayChange(e, index, 'certifications')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addArrayItem('certifications', {
                                                    name: '',
                                                    organization: '',
                                                    start_year: '',
                                                    end_year: '',
                                                    is_time_limited: false,
                                                    description: ''
                                                })}
                                                className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                                Add Certification
                                            </button>
                                        </div>
                                    )}

                                    {/* 3. Accomplishments section - muncul jika checkbox dicentang */}
                                    {addOnSections.accomplishments && (
                                        <div className="mb-8">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                                Accomplishments
                                                <span className="ml-1 inline-flex items-center">
                                                    <div className="relative ml-1 group">
                                                        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                            Include awards, honors, publications, or any other notable achievements
                                                        </div>
                                                    </div>
                                                </span>
                                            </h2>

                                            {formData.accomplishments.map((accomplishment, index) => (
                                                <div key={index} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                                    <div className="flex justify-between mb-2">
                                                        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                            Accomplishment #{index + 1}
                                                        </h3>
                                                        {formData.accomplishments.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArrayItem('accomplishments', index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Title <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="title"
                                                                value={accomplishment.title}
                                                                placeholder="e.g. First Place in Hackathon, Published Research Paper"
                                                                onChange={(e) => handleArrayChange(e, index, 'accomplishments')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                name="date"
                                                                value={accomplishment.date}
                                                                onChange={(e) => handleArrayChange(e, index, 'accomplishments')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            />
                                                        </div> */}
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Description <span className="text-red-600">*</span>
                                                        </label>
                                                        <textarea
                                                            name="description"
                                                            value={accomplishment.description}
                                                            placeholder="eg: Received Employee of the Month award for increasing team productivity by 25%"
                                                            onChange={(e) => handleArrayChange(e, index, 'accomplishments')}
                                                            onKeyDown={(e) => {
                                                                if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                    e.preventDefault();
                                                                    const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                    const updatedArray = [...formData.accomplishments];
                                                                    updatedArray[index] = {
                                                                        ...updatedArray[index],
                                                                        description: updatedValue
                                                                    };
                                                                    setFormData({
                                                                        ...formData,
                                                                        accomplishments: updatedArray
                                                                    });
                                                                }
                                                            }}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addArrayItem('accomplishments', {
                                                    title: '',
                                                    date: '',
                                                    description: ''
                                                })}
                                                className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                                Add Accomplishment
                                            </button>
                                        </div>
                                    )}

                                    {/* 4. Organizations section - muncul jika checkbox dicentang */}
                                    {addOnSections.organizations && (
                                        <div className="mb-8">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                                Organizations
                                                <span className="ml-1 inline-flex items-center">
                                                    <div className="relative ml-1 group">
                                                        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 cursor-help">?</div>
                                                        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                                            Include professional organizations, clubs, volunteer work, or community involvement
                                                        </div>
                                                    </div>
                                                </span>
                                            </h2>

                                            {formData.organizations.map((org, index) => (
                                                <div key={index} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                                    <div className="flex justify-between mb-2">
                                                        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                                            Organization #{index + 1}
                                                        </h3>
                                                        {formData.organizations.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArrayItem('organizations', index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Organization Name <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={org.name}
                                                                placeholder="eg: IEEE"
                                                                onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Position <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="position"
                                                                value={org.position}
                                                                placeholder="eg: Member"
                                                                onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Start Date <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="month"
                                                                name="start_date"
                                                                value={org.start_date}
                                                                onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                End Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                name="end_date"
                                                                value={org.end_date}
                                                                onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white ${org.is_current ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}`}
                                                                disabled={org.is_current}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mb-3 flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`is_current_org_${index}`}
                                                            name="is_current"
                                                            checked={org.is_current || false}
                                                            onChange={(e) => {
                                                                const newOrganizations = [...formData.organizations];
                                                                newOrganizations[index] = {
                                                                    ...newOrganizations[index],
                                                                    is_current: e.target.checked
                                                                };
                                                                setFormData({
                                                                    ...formData,
                                                                    organizations: newOrganizations
                                                                });
                                                            }}
                                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`is_current_org_${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                            I am currently active in this organization
                                                        </label>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Description <span className="text-red-600">*</span>
                                                        </label>
                                                        <textarea
                                                            name="description"
                                                            value={org.description}
                                                            placeholder="Describe your role, responsibilities, and accomplishments in this organization"
                                                            onChange={(e) => handleArrayChange(e, index, 'organizations')}
                                                            onKeyDown={(e) => {
                                                                if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                                    e.preventDefault();
                                                                    const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                                    const updatedArray = [...formData.organizations];
                                                                    updatedArray[index] = {
                                                                        ...updatedArray[index],
                                                                        description: updatedValue
                                                                    };
                                                                    setFormData({
                                                                        ...formData,
                                                                        organizations: updatedArray
                                                                    });
                                                                }
                                                            }}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addArrayItem('organizations', {
                                                    name: '',
                                                    position: '',
                                                    start_date: '',
                                                    end_date: '',
                                                    is_current: false,
                                                    description: ''
                                                })}
                                                className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                                Add Organization
                                            </button>
                                        </div>
                                    )}

                                    {/* 5. Languages section - muncul jika checkbox dicentang */}
                                    {addOnSections.languages && (
                                        <div className="mb-8">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                                Languages
                                            </h2>

                                            {formData.languages.map((lang, index) => (
                                                <div key={index} className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                    <div className="col-span-1 md:col-span-1">
                                                        <input
                                                            type="text"
                                                            name="language"
                                                            value={lang.language}
                                                            placeholder="eg: English"
                                                            onChange={(e) => handleArrayChange(e, index, 'languages')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="col-span-1 md:col-span-2">
                                                        <select
                                                            name="level"
                                                            value={lang.level}
                                                            onChange={(e) => handleArrayChange(e, index, 'languages')}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                            required
                                                        >
                                                            <option value="">Please select</option>
                                                            <option value="Native">Native or bilingual proficiency</option>
                                                            <option value="Fluent">Full professional proficiency</option>
                                                            <option value="Advanced">Professional working proficiency</option>
                                                            <option value="Intermediate">Limited working proficiency</option>
                                                            <option value="Basic">Elementary proficiency</option>
                                                        </select>
                                                    </div>

                                                    <div className="col-span-1 md:col-span-1 flex justify-end">
                                                        {formData.languages.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArrayItem('languages', index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addArrayItem('languages', { language: '', level: '' })}
                                                className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                                Add Language
                                            </button>
                                        </div>
                                    )}

                                    {/* 6. Additional Information section - muncul jika checkbox dicentang */}
                                    {addOnSections.additional_info && (
                                        <div className="mb-8">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                                Additional Information
                                            </h2>

                                            <div className="mb-3">
                                                <textarea
                                                    name="additional_info"
                                                    value={formData.additional_info}
                                                    onChange={handleChange}
                                                    onKeyDown={(e) => {
                                                        if (e.key === ' ' && e.currentTarget.value.endsWith('-')) {
                                                            e.preventDefault();
                                                            const updatedValue = e.currentTarget.value.slice(0, -1) + '• ';
                                                            setFormData({
                                                                ...formData,
                                                                additional_info: updatedValue
                                                            });
                                                        }
                                                    }}
                                                    placeholder="Include any other information you'd like to share, such as hobbies, volunteer work, or personal interests relevant to your application"
                                                    rows={5}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
                                                ></textarea>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-500 active:bg-red-700 focus:outline-none focus:border-red-700 focus:ring ring-red-300 disabled:opacity-25 transition w-full"
                                        >
                                            Buat CV Saya
                                        </button>
                                        <button
                                            type="button"
                                            onClick={togglePreview}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-gray-900 dark:text-white uppercase tracking-widest hover:bg-gray-300 dark:hover:bg-gray-500 active:bg-gray-400 dark:active:bg-gray-700 focus:outline-none focus:ring ring-gray-300 disabled:opacity-25 transition w-full"
                                        >
                                            {showPreview ? 'Tutup Preview' : 'Preview CV'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Preview Section */}
                        {showPreview && (
                            <div className="md:w-1/2 transition-all duration-300">
                                <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-4 h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            Preview CV
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={togglePreview}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="overflow-auto max-h-[800px] bg-gray-50 rounded p-3">
                                        <CV data={formData} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}