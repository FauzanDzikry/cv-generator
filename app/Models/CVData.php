<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CVData extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    public function getTable()
    {
        return $this->getConnection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';
    }

    protected $fillable = [
        'user_id',
        'cv_name',
        'name',
        'address',
        'phone',
        'email',
        'linkedin',
        'summary',
        'additional_info',
        'custom_fields',
    ];

    protected $casts = [
        'custom_fields' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi 8 CV sections terurut berdasarkan sort_order
    public function work_experience()
    {
        return $this->hasMany(CVWorkExperience::class, 'cv_data_id')->orderBy('sort_order');
    }

    public function education()
    {
        return $this->hasMany(CVEducation::class, 'cv_data_id')->orderBy('sort_order');
    }

    public function skills()
    {
        return $this->hasMany(CVSkill::class, 'cv_data_id')->orderBy('sort_order');
    }

    public function portfolios()
    {
        return $this->hasMany(CVPortfolio::class, 'cv_data_id')->orderBy('sort_order');
    }

    public function certifications()
    {
        return $this->hasMany(CVCertification::class, 'cv_data_id')->orderBy('sort_order');
    }

    public function languages()
    {
        return $this->hasMany(CVLanguage::class, 'cv_data_id')->orderBy('sort_order');
    }

    public function accomplishments()
    {
        return $this->hasMany(CVAccomplishment::class, 'cv_data_id')->orderBy('sort_order');
    }

    public function organizations()
    {
        return $this->hasMany(CVOrganization::class, 'cv_data_id')->orderBy('sort_order');
    }
}
