<?php

namespace App\Models;

class CVLanguage extends CVSection
{
    protected $table = 'languages';

    protected $fillable = [
        'cv_data_id',
        'sort_order',
        'language',
        'level',
        'has_certification',
        'test_name',
        'issuing_organization',
        'score',
        'issue_date',
        'expiration_date',
        'is_time_limited',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'has_certification' => 'boolean',
        'is_time_limited' => 'boolean',
    ];
}
