<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Lesson;

class TranslateContentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct(
        protected string $lessonId,
        protected array  $targetLanguages = ['hi', 'pa']
    ) {}

    public function handle(): void
    {
        $lesson = Lesson::find($this->lessonId);
        if (!$lesson) {
            Log::warning("TranslateContentJob: Lesson {$this->lessonId} not found.");
            return;
        }

        $aiUrl = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');
        $translations = $lesson->translations ?? [];

        foreach ($this->targetLanguages as $lang) {
            try {
                $response = Http::timeout(90)->post("{$aiUrl}/ai/translate-lesson", [
                    'title'           => $lesson->title,
                    'content'         => $lesson->content,
                    'target_language' => $lang,
                    'grade_level'     => $lesson->grade_level ?? 8,
                ]);

                if ($response->successful()) {
                    $translated = $response->json();
                    $translations[$lang] = [
                        'title'   => $translated['title']   ?? $lesson->title,
                        'content' => $translated['content'] ?? $lesson->content,
                    ];
                    Log::info("Lesson {$this->lessonId} translated to {$lang}");
                } else {
                    Log::warning("Translation to {$lang} failed for lesson {$this->lessonId}", ['status' => $response->status()]);
                }
            } catch (\Exception $e) {
                Log::error("TranslateContentJob error", ['lesson' => $this->lessonId, 'lang' => $lang, 'error' => $e->getMessage()]);
            }
        }

        $lesson->translations = $translations;
        $lesson->save();
    }
}
