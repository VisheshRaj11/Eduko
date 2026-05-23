<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIFlashcardController extends Controller
{
    protected string $aiUrl;

    public function __construct()
    {
        $this->aiUrl = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'lesson_id'  => 'nullable|string',
            'subject'    => 'nullable|string|max:100',
            'count'      => 'required|integer|min:1|max:20',
            'prompt'     => 'nullable|string|max:500',
        ]);

        try {
            $response = Http::timeout(60)->post("{$this->aiUrl}/ai/flashcards/generate", $validated);
            
            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to generate flashcards from AI service.'], 502);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI service unavailable.'], 503);
        }
    }
}
