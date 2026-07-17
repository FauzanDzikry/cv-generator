import React, { useState } from 'react';

interface ProgressBarProps {
    percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
    return (
        <div className="mb-4 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-2.5 rounded-full bg-red-600 transition-all duration-500 ease-in-out" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

interface FormProgressProps {
    formData: any;
    fieldGroups: {
        [key: string]: {
            label: string;
            fields: string[];
            isArray?: boolean;
            requiredFields?: string[];
        };
    };
    addOnSections?: {
        [key: string]: boolean;
    };
}

interface ProgressDetail {
    section: string;
    label: string;
    filled: number;
    total: number;
    percentage: number;
}

const FormProgress: React.FC<FormProgressProps> = ({ formData, fieldGroups, addOnSections = {} }) => {
    const [expanded, setExpanded] = useState(false);

    // Hitung total field yang harus diisi
    const calculateProgress = () => {
        let totalFields = 0;
        let filledFields = 0;
        const sectionDetails: ProgressDetail[] = [];

        Object.entries(fieldGroups).forEach(([key, group]) => {
            // Lewati section jika itu adalah add-on yang tidak dicentang
            if (
                (key === 'portfolio' && addOnSections.portfolios === false) ||
                (key === 'certifications' && addOnSections.certifications === false) ||
                (key === 'accomplishments' && addOnSections.accomplishments === false) ||
                (key === 'organizations' && addOnSections.organizations === false) ||
                (key === 'languages' && addOnSections.languages === false) ||
                (key === 'additional_info' && addOnSections.additional_info === false)
            ) {
                return;
            }

            let sectionTotalFields = 0;
            let sectionFilledFields = 0;

            if (group.isArray) {
                // Jika field adalah array (seperti work_experience, education, dll)
                if (Array.isArray(formData[key]) && formData[key].length > 0) {
                    formData[key].forEach((item: any) => {
                        const fieldsToCheck = group.requiredFields || group.fields;
                        fieldsToCheck.forEach((field) => {
                            // Jika field adalah end_date dan is_current bernilai true, anggap sudah terisi
                            if (field === 'end_date' && item.is_current === true) {
                                sectionTotalFields += 1;
                                sectionFilledFields += 1;
                                totalFields += 1;
                                filledFields += 1;
                                return;
                            }

                            sectionTotalFields += 1;
                            totalFields += 1;

                            if (item[field] && String(item[field]).trim() !== '') {
                                sectionFilledFields += 1;
                                filledFields += 1;
                            }
                        });
                    });
                } else {
                    // Jika array kosong, masih ada minimal 1 set field
                    const fieldsCount = (group.requiredFields || group.fields).length;
                    sectionTotalFields += fieldsCount;
                    totalFields += fieldsCount;
                }
            } else {
                // Jika field reguler (bukan array)
                group.fields.forEach((field) => {
                    // Lewati field photo dan is_use_photo
                    if (field === 'photo' || field === 'is_use_photo') {
                        return;
                    }

                    if (group.requiredFields && !group.requiredFields.includes(field)) {
                        return;
                    }

                    sectionTotalFields += 1;
                    totalFields += 1;

                    if (formData[field] && String(formData[field]).trim() !== '') {
                        sectionFilledFields += 1;
                        filledFields += 1;
                    }
                });
            }

            sectionDetails.push({
                section: key,
                label: group.label,
                filled: sectionFilledFields,
                total: sectionTotalFields,
                percentage: sectionTotalFields > 0 ? Math.round((sectionFilledFields / sectionTotalFields) * 100) : 0,
            });
        });

        return {
            percentage: totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0,
            filledFields,
            totalFields,
            sections: sectionDetails,
        };
    };

    const progress = calculateProgress();

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    return (
        <div className="mb-6">
            <div className="mb-1 flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">Progress</h3>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress.percentage}%</span>
                    <button
                        onClick={toggleExpand}
                        className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title={expanded ? 'Tutup detail' : 'Lihat detail'}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <ProgressBar percentage={progress.percentage} />

            {expanded && (
                <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-2 font-medium text-gray-700 dark:text-gray-300">Detail Progress</h4>
                    <div className="space-y-3">
                        {progress.sections &&
                            progress.sections.map((section, index) => (
                                <div key={index} className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">{section.label}</span>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">
                                            {section.filled}/{section.total} ({section.percentage}%)
                                        </span>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div className="h-1.5 rounded-full bg-red-600" style={{ width: `${section.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormProgress;
