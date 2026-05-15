<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:8001'));
    }

    public function chat(string $message, string $language, string $userId, array $history = []): string
    {
        $response = Http::timeout(30)->post("{$this->baseUrl}/ai/chat", [
            'message'  => $message,
            'language' => $language,
            'user_id'  => $userId,
            'history'  => $history,
        ]);

        if ($response->failed()) {
            Log::error('AI chat failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('AI service unavailable');
        }

        return $response->json('response', '');
    }

    public function generateLearningPlan(string $studentId, string $gradeLevel, string $language, array $progressData = []): array
    {
        $response = Http::timeout(60)->post("{$this->baseUrl}/ai/generate-plan", [
            'student_id'   => $studentId,
            'grade_level'  => $gradeLevel,
            'language'     => $language,
            'progress'     => $progressData,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('AI plan generation failed');
        }

        return $response->json();
    }

    public function translate(string $text, string $targetLanguage): string
    {
        $response = Http::timeout(15)->post("{$this->baseUrl}/ai/translate", [
            'text'     => $text,
            'target'   => $targetLanguage,
        ]);

        return $response->json('translated', $text);
    }

    public function speechToText(string $filePath): string
    {
        $response = Http::timeout(30)->attach('audio', file_get_contents($filePath), basename($filePath))
            ->post("{$this->baseUrl}/ai/speech-to-text");

        return $response->json('text', '');
    }

    public function ocr(string $filePath): string
    {
        $response = Http::timeout(20)->attach('image', file_get_contents($filePath), basename($filePath))
            ->post("{$this->baseUrl}/ai/ocr");

        return $response->json('text', '');
    }
}
