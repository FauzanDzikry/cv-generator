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
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
