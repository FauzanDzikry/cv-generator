<?php

namespace App\Models;

class CVAccomplishment extends CVSection
{
    protected $table = 'accomplishments';

    protected $fillable = [
        'cv_data_id',
        'sort_order',
        'description',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
