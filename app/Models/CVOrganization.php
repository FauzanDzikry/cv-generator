<?php

namespace App\Models;

class CVOrganization extends CVSection
{
    protected $table = 'organizations';

    protected $fillable = [
        'cv_data_id',
        'sort_order',
        'name',
        'position',
        'start_date',
        'end_date',
        'is_current',
        'description',
    ];

    protected $casts = [
        'is_current' => 'boolean',
        'sort_order' => 'integer',
    ];
}
