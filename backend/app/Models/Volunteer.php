<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Volunteer extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'volunteers';
    protected $fillable = ['user_id', 'name', 'phone', 'specialization', 'availability'];

    public function sessions() { return $this->hasMany(Session::class, 'volunteer_id'); }
}
