<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CVDataRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    protected function prepareForValidation(): void
    {
        $input = $this->all();

        $cleanArray = function (?array $items, array $dateOrIntFields, array $boolFields = []): ?array {
            if (!$items || !is_array($items)) {
                return $items;
            }
            foreach ($items as &$item) {
                if (!is_array($item)) {
                    continue;
                }
                foreach ($dateOrIntFields as $f) {
                    if (array_key_exists($f, $item)) {
                        if ($item[$f] === '' || $item[$f] === null) {
                            $item[$f] = null;
                        } elseif (in_array($f, ['start_date', 'end_date']) && is_string($item[$f])) {
                            $strVal = trim($item[$f]);
                            if (preg_match('/^\d{4}-\d{2}$/', $strVal)) {
                                $item[$f] = $strVal . '-01';
                            } elseif (preg_match('/^\d{4}$/', $strVal)) {
                                $item[$f] = $strVal . '-01-01';
                            }
                        }
                    }
                }
                foreach ($boolFields as $bf) {
                    if (array_key_exists($bf, $item)) {
                        $item[$bf] = filter_var($item[$bf], FILTER_VALIDATE_BOOLEAN);
                    }
                }
            }
            return $items;
        };

        if ($this->has('work_experience')) {
            $input['work_experience'] = $cleanArray($this->input('work_experience'), ['start_date', 'end_date'], ['is_current']);
        }
        if ($this->has('education')) {
            $input['education'] = $cleanArray($this->input('education'), ['start_date', 'end_date']);
        }
        if ($this->has('certifications')) {
            $input['certifications'] = $cleanArray($this->input('certifications'), ['start_year', 'end_year'], ['is_time_limited']);
        }
        if ($this->has('organizations')) {
            $input['organizations'] = $cleanArray($this->input('organizations'), ['start_date', 'end_date'], ['is_current']);
        }

        $this->replace($input);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cv_name' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email'],
            'linkedin' => ['nullable', 'string', 'max:500'],
            'summary' => ['required', 'string'],

            'work_experience' => ['required', 'array'],
            'work_experience.*.company' => ['nullable', 'string', 'max:255'],
            'work_experience.*.company_location' => ['nullable', 'string', 'max:255'],
            'work_experience.*.position' => ['nullable', 'string', 'max:255'],
            'work_experience.*.location_type' => ['nullable', 'string', 'max:255'],
            'work_experience.*.start_date' => ['nullable', 'date'],
            'work_experience.*.end_date' => ['nullable', 'date'],
            'work_experience.*.description' => ['nullable', 'string'],
            'work_experience.*.is_current' => ['nullable', 'boolean'],

            'education' => ['required', 'array'],
            'education.*.institution' => ['nullable', 'string', 'max:255'],
            'education.*.degree' => ['nullable', 'string', 'max:255'],
            'education.*.field' => ['nullable', 'string', 'max:255'],
            'education.*.start_date' => ['nullable', 'date'],
            'education.*.end_date' => ['nullable', 'date'],
            'education.*.description' => ['nullable', 'string'],

            'skills' => ['required', 'array'],
            'skills.*.name' => ['nullable', 'string', 'max:255'],

            'portfolios' => ['nullable', 'array'],
            'portfolios.*.title' => ['nullable', 'string', 'max:255'],
            'portfolios.*.link' => ['nullable', 'string', 'max:500'],
            'portfolios.*.description' => ['nullable', 'string'],

            'certifications' => ['nullable', 'array'],
            'certifications.*.name' => ['nullable', 'string', 'max:255'],
            'certifications.*.organization' => ['nullable', 'string', 'max:255'],
            'certifications.*.start_year' => ['nullable', 'integer'],
            'certifications.*.end_year' => ['nullable', 'integer'],
            'certifications.*.is_time_limited' => ['nullable', 'boolean'],
            'certifications.*.description' => ['nullable', 'string'],
            'certifications.*.credential_id' => ['nullable', 'string', 'max:255'],

            'languages' => ['nullable', 'array'],
            'languages.*.language' => ['nullable', 'string', 'max:255'],
            'languages.*.level' => ['nullable', 'string', 'max:255'],

            'accomplishments' => ['nullable', 'array'],
            'accomplishments.*.description' => ['nullable', 'string'],

            'organizations' => ['nullable', 'array'],
            'organizations.*.name' => ['nullable', 'string', 'max:255'],
            'organizations.*.position' => ['nullable', 'string', 'max:255'],
            'organizations.*.start_date' => ['nullable', 'date'],
            'organizations.*.end_date' => ['nullable', 'date'],
            'organizations.*.is_current' => ['nullable', 'boolean'],
            'organizations.*.description' => ['nullable', 'string'],

            'additional_info' => ['nullable', 'string'],
            'custom_fields' => ['nullable', 'array'],
        ];
    }
}
