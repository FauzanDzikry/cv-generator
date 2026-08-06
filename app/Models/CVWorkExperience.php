<?php

namespace App\Models;

class CVWorkExperience extends CVSection
{
    protected $table = 'work_experiences';

    protected $fillable = [
        'cv_data_id',
        'sort_order',
        'company',
        'company_location',
        'position',
        'location_type',
        'start_date',
        'end_date',
        'description',
        'is_current',
    ];

    protected $casts = [
        'is_current' => 'boolean',
        'sort_order' => 'integer',
    ];
}
