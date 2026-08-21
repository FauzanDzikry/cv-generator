<?php

namespace App\Models;

class CVCertification extends CVSection
{
    protected $table = 'certifications';

    protected $fillable = [
        'cv_data_id',
        'sort_order',
        'name',
        'organization',
        'start_year',
        'end_year',
        'is_time_limited',
        'description',
        'credential_id',
    ];

    protected $casts = [
        'is_time_limited' => 'boolean',
        'start_year' => 'date:Y-m',
        'end_year' => 'date:Y-m',
        'sort_order' => 'integer',
    ];
}
