<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Student extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'students';

    protected $fillable = ['user_id', 'grade_level', 'progress_summary', 'preferences', 'streak', 'points', 'badges', 'bio'];
    protected $casts    = ['badges' => 'array', 'preferences' => 'array', 'progress_summary' => 'array'];

    public function user() { return $this->belongsTo(User::class, 'user_id'); }
    public function progress() { return $this->hasMany(Progress::class, 'student_id'); }
    public function learningPlan() { return $this->hasOne(LearningPlan::class, 'student_id'); }
}
