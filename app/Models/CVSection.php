<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

abstract class CVSection extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $hidden = [
        'id',
        'cv_data_id',
        'sort_order',
        'created_at',
        'updated_at',
    ];

    public function getTable()
    {
        $table = $this->table ?? parent::getTable();
        if ($this->getConnection()->getDriverName() !== 'sqlite' && !str_contains($table, '.')) {
            return 'cv.' . $table;
        }
        return $table;
    }
}
