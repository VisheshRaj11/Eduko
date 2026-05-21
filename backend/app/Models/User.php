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
        'name',
        'email',
        'password',
        'role',
        'phone',
        'language',
        'grade_level',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'created_at'        => 'datetime',
        'email_verified_at' => 'datetime',
    ];

    // ── Override tokens() to use our MongoDB-backed token model ──────────
    public function tokens()
    {
        return $this->morphMany(PersonalAccessToken::class, 'tokenable');
    }

    // ── Relationships ─────────────────────────────────────────────────────
    public function student()      { return $this->hasOne(Student::class, 'user_id'); }
    public function teacher()      { return $this->hasOne(Teacher::class, 'user_id'); }
    public function volunteer()    { return $this->hasOne(Volunteer::class, 'user_id'); }
    public function chatMessages() { return $this->hasMany(ChatMessage::class, 'user_id'); }
}
