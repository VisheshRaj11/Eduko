<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Quiz extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'quizzes';
    protected $fillable = ['lesson_id', 'title', 'questions'];
    protected $casts = ['questions' => 'array'];

    public function lesson() { return $this->belongsTo(Lesson::class, 'lesson_id'); }
}
