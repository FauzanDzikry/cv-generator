<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CVData extends Model
{
    protected $table = 'cv.cv_data';

    protected $fillable = [
        'user_id',
        'cv_name',
        'name',
        'address',
        'phone',
        'email',
        'linkedin',
        'summary',
        'work_experience',
        'education',
        'skills',
        'portfolios',
        'certifications',
        'languages',
        'accomplishments',
        'organizations',
        'additional_info',
        'custom_fields',
    ];

    // Kolom bertipe JSON
    protected $casts = [
        'work_experience'   => 'array',
        'education'         => 'array',
        'skills'            => 'array',
        'portfolios'        => 'array',
        'certifications'    => 'array',
        'languages'         => 'array',
        'accomplishments'   => 'array',
        'organizations'     => 'array',
        'additional_info'   => 'array',
        'custom_fields'     => 'array',
        'created_at'        => 'datetime',
        'updated_at'        => 'datetime',
        'deleted_at'        => 'datetime',
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
