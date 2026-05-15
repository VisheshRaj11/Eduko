<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Progress extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'progress';
    protected $fillable = ['student_id', 'lesson_id', 'score', 'attempts', 'completed_at'];
    protected $casts = ['completed_at' => 'datetime'];

    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
    public function lesson()  { return $this->belongsTo(Lesson::class, 'lesson_id'); }
}
