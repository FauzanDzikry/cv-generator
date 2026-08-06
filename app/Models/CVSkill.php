<?php

namespace App\Models;

class CVSkill extends CVSection
{
    protected $table = 'skills';

    protected $fillable = [
        'cv_data_id',
        'sort_order',
        'name',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
