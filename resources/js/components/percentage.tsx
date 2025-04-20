import React from 'react';

interface ProgressBarProps {
    percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
            <div 
                className="bg-red-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${percentage}%` }}
            ></div>
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
}

const FormProgress: React.FC<FormProgressProps> = ({ formData, fieldGroups }) => {
    // Hitung total field yang harus diisi
    const calculateProgress = () => {
        let totalFields = 0;
        let filledFields = 0;
        
        Object.entries(fieldGroups).forEach(([key, group]) => {
            if (group.isArray) {
                // Jika field adalah array (seperti work_experience, education, dll)
                if (Array.isArray(formData[key]) && formData[key].length > 0) {
                    formData[key].forEach((item: any) => {
                        const fieldsToCheck = group.requiredFields || group.fields;
                        fieldsToCheck.forEach(field => {
                            totalFields += 1;
                            if (item[field] && item[field].trim() !== '') {
                                filledFields += 1;
                            }
                        });
                    });
                } else {
                    // Jika array kosong, masih ada minimal 1 set field
                    totalFields += (group.requiredFields || group.fields).length;
                }
            } else {
                // Jika field reguler (bukan array)
                group.fields.forEach(field => {
                    totalFields += 1;
                    if (formData[field] && formData[field].toString().trim() !== '') {
                        filledFields += 1;
                    }
                });
            }
        });
        
        return {
            percentage: totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0,
            filledFields,
            totalFields
        };
    };

    const progress = calculateProgress();

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">
                    Progress
                </h3>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {progress.percentage}%
                </span>
            </div>
            <ProgressBar percentage={progress.percentage} />
        </div>
    );
};

export default FormProgress;
