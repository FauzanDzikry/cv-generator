<?php

namespace App\Models;

class CVPortfolio extends CVSection
{
    protected $table = 'portfolios';

    protected $fillable = [
        'cv_data_id',
        'sort_order',
        'title',
        'link',
        'description',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
