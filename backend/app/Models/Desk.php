<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Desk extends Model
{
    protected $fillable = [
        'name',
        'height',
        'min_height',
        'max_height',
        'state'
    ];
}
