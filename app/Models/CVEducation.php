<?php

namespace App\Models;

class CVEducation extends CVSection
{
    protected $table = 'educations';

    protected $fillable = [
        'cv_data_id',
        'sort_order',
        'institution',
        'degree',
        'field',
        'start_date',
        'end_date',
        'description',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
