<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class LearningPlan extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'learning_plans';
    protected $fillable = ['student_id', 'weekly_plan', 'generated_at'];
    protected $casts = ['weekly_plan' => 'array', 'generated_at' => 'datetime'];

    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
}
