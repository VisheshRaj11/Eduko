<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'name', 'phone', 'role', 'language', 'password',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = ['created_at' => 'datetime'];

    // Relationships
    public function student() { return $this->hasOne(Student::class, 'user_id'); }
    public function teacher() { return $this->hasOne(Teacher::class, 'user_id'); }
    public function chatMessages() { return $this->hasMany(ChatMessage::class, 'user_id'); }
}
