<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class ChatMessage extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'chat_messages';
    protected $fillable = ['user_id', 'message', 'response', 'language'];

    public function user() { return $this->belongsTo(User::class, 'user_id'); }
}
