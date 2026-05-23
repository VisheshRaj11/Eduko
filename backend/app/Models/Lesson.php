<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Lesson extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'lessons';

    protected $guarded = [];

    protected $casts = ['content_blocks' => 'array', 'resources' => 'array'];

    public function quizzes() { return $this->hasMany(Quiz::class, 'lesson_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }

    // Scopes
    public function scopeByLanguage($query, $lang) { return $query->where('language', $lang); }
    public function scopeBySubject($query, $sub)  { return $query->where('subject', $sub); }
    public function scopeByDifficulty($query, $d) { return $query->where('difficulty', $d); }
}
