<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Session extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'sessions';
    protected $fillable = ['volunteer_id', 'student_id', 'scheduled_time', 'status', 'subject'];
    protected $casts = ['scheduled_time' => 'datetime'];

    public function volunteer() { return $this->belongsTo(Volunteer::class, 'volunteer_id'); }
    public function student()   { return $this->belongsTo(Student::class, 'student_id'); }
}
