<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Laravel\Sanctum\Contracts\HasAbilities;

/**
 * MongoDB-native Sanctum Personal Access Token.
 *
 * Must use MongoDB\Laravel\Eloquent\Model as base (not Sanctum's SQL model).
 * Sanctum is told to use this class via Sanctum::usePersonalAccessTokenModel()
 * in AppServiceProvider, so the type-hint issue in NewAccessToken is bypassed
 * by also overriding createToken() on the User model to build NewAccessToken
 * with the correct type.
 */
class PersonalAccessToken extends Model implements HasAbilities
{
    protected $connection = 'mongodb';
    protected $collection = 'personal_access_tokens';

    protected $fillable = [
        'name',
        'token',
        'abilities',
        'tokenable_id',
        'tokenable_type',
        'expires_at',
        'last_used_at',
    ];

    protected $casts = [
        'abilities'    => 'array',
        'last_used_at' => 'datetime',
        'expires_at'   => 'datetime',
    ];

    /**
     * Polymorphic owner of this token.
     */
    public function tokenable()
    {
        return $this->morphTo('tokenable');
    }

    /**
     * Find a token instance by its plain-text value.
     * Called by Sanctum's middleware to authenticate requests.
     */
    public static function findToken(string $token): ?static
    {
        if (!str_contains($token, '|')) {
            return static::where('token', hash('sha256', $token))->first();
        }

        [$id, $plain] = explode('|', $token, 2);
        $instance = static::find($id);

        if ($instance && hash_equals($instance->token, hash('sha256', $plain))) {
            return $instance;
        }

        return null;
    }

    /** @inheritDoc */
    public function can($ability): bool
    {
        $abilities = $this->abilities ?? ['*'];
        return in_array('*', $abilities) || in_array($ability, $abilities);
    }

    /** @inheritDoc */
    public function cant($ability): bool
    {
        return !$this->can($ability);
    }
}
