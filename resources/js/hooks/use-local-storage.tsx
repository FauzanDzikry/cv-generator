import { useState, useEffect } from 'react';

/**
 * Custom hook untuk mengelola localStorage dengan auto-save
 * @param key - Kunci localStorage
 * @param initialValue - Nilai awal jika tidak ada data tersimpan
 * @param debounceMs - Delay untuk debouncing (default: 500ms)
 * @returns [value, setValue, status] - Value, setter function, dan status save
 */
export function useLocalStorage<T>(
    key: string, 
    initialValue: T, 
    debounceMs: number = 500
): [T, (value: T | ((prev: T) => T)) => void, 'saving' | 'saved' | 'idle'] {
    
    const [status, setStatus] = useState<'saving' | 'saved' | 'idle'>('idle');
    
    // Fungsi untuk mendapatkan nilai awal dari localStorage
    const getStoredValue = (): T => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState<T>(getStoredValue);

    // Fungsi untuk mengupdate nilai
    const setValue = (value: T | ((prev: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
        } catch (error) {
            console.error(`Error setting value for localStorage key "${key}":`, error);
        }
    };

    // Effect untuk auto-save dengan debouncing
    useEffect(() => {
        if (typeof window === 'undefined') return;

        setStatus('saving');

        const timeoutId = setTimeout(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
                setStatus('saved');
                
                // Reset status setelah 2 detik
                setTimeout(() => setStatus('idle'), 2000);
            } catch (error) {
                console.error(`Error saving to localStorage key "${key}":`, error);
                setStatus('idle');
            }
        }, debounceMs);

        return () => clearTimeout(timeoutId);
    }, [key, storedValue, debounceMs]);

    return [storedValue, setValue, status];
}

/**
 * Custom hook untuk mengelola form dengan localStorage
 * @param key - Kunci localStorage
 * @param initialFormData - Data form awal
 * @param debounceMs - Delay untuk debouncing (default: 500ms)
 */
export function useFormLocalStorage<T extends Record<string, any>>(
    key: string,
    initialFormData: T,
    debounceMs: number = 500
) {
    const [formData, setFormData, status] = useLocalStorage(key, initialFormData, debounceMs);

    // Fungsi helper untuk mengupdate field tertentu
    const updateField = <K extends keyof T>(field: K, value: T[K]) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Fungsi untuk mereset form
    const resetForm = () => {
        setFormData(initialFormData);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.removeItem(key);
            } catch (error) {
                console.error(`Error removing localStorage key "${key}":`, error);
            }
        }
    };

    // Fungsi untuk cek apakah form kosong
    const isFormEmpty = () => {
        return Object.values(formData).every(value => 
            value === '' || value === null || value === undefined ||
            (Array.isArray(value) && value.length === 0)
        );
    };

    return {
        formData,
        setFormData,
        updateField,
        resetForm,
        isFormEmpty,
        saveStatus: status
    };
}

/**
 * Utility functions untuk localStorage
 */
export const localStorageUtils = {
    // Cek apakah localStorage tersedia
    isAvailable: (): boolean => {
        if (typeof window === 'undefined') return false;
        
        try {
            const testKey = '__localStorage_test__';
            window.localStorage.setItem(testKey, 'test');
            window.localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    },

    // Dapatkan ukuran localStorage yang terpakai
    getUsedSpace: (): number => {
        if (!localStorageUtils.isAvailable()) return 0;
        
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    },

    // Dapatkan semua keys localStorage
    getAllKeys: (): string[] => {
        if (!localStorageUtils.isAvailable()) return [];
        return Object.keys(localStorage);
    },

    // Hapus semua data localStorage dengan prefix tertentu
    clearByPrefix: (prefix: string): void => {
        if (!localStorageUtils.isAvailable()) return;
        
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    },

    // Backup semua data localStorage
    backup: (): string => {
        if (!localStorageUtils.isAvailable()) return '{}';
        
        const backup: Record<string, string> = {};
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                backup[key] = localStorage[key];
            }
        }
        return JSON.stringify(backup);
    },

    // Restore data localStorage dari backup
    restore: (backupString: string): boolean => {
        if (!localStorageUtils.isAvailable()) return false;
        
        try {
            const backup = JSON.parse(backupString);
            for (let key in backup) {
                localStorage.setItem(key, backup[key]);
            }
            return true;
        } catch (error) {
            console.error('Error restoring localStorage backup:', error);
            return false;
        }
    }
};

export default useLocalStorage; 