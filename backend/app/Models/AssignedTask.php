<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class AssignedTask extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'assigned_tasks';

    protected $fillable = [
        'teacher_id',
        'student_id',
        'task_description',
        'is_completed',
        'completed_at'
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime'
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
