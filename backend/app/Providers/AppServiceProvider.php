<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use App\Models\PersonalAccessToken;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Use MongoDB-backed token model instead of default SQL one
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
    }
}
