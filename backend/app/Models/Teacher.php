<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Teacher extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'teachers';
    protected $fillable = ['user_id', 'specialization', 'ai_suggestions', 'name', 'email', 'subjects'];
    protected $casts = ['subjects' => 'array'];

    public function user() { return $this->belongsTo(User::class, 'user_id'); }
    public function lessons() { return $this->hasMany(Lesson::class, 'created_by'); }
}
