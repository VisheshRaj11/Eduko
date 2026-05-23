<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Progress extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'progress';
    protected $fillable = [
        'student_id', 'lesson_id', 'user_id', 'quiz_id', 'type', 'score', 
        'attempts', 'completed_at', 'correct', 'total', 'answers', 
        'completed', 'completion_pct', 'subject', 'ai_rating', 'feedback'
    ];
    protected $casts = [
        'completed_at' => 'datetime',
        'answers' => 'array'
    ];

    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
    public function lesson()  { return $this->belongsTo(Lesson::class, 'lesson_id'); }
}
