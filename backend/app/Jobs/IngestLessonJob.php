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

class IngestLessonJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(protected string $lessonId)
    {
    }

    public function handle(): void
    {
        $lesson = Lesson::find($this->lessonId);
        if (!$lesson) {
            Log::warning("IngestLessonJob: Lesson {$this->lessonId} not found.");
            return;
        }

        $aiUrl = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');

        try {
            $response = Http::timeout(30)->post("{$aiUrl}/ai/ingest", [
                'lesson_id' => (string) $lesson->_id,
                'title'     => $lesson->title,
                'content'   => $lesson->content,
                'subject'   => $lesson->subject,
                'language'  => $lesson->language ?? 'en',
                'grade'     => $lesson->grade_level ?? 8,
            ]);

            if ($response->successful()) {
                Log::info("Lesson {$this->lessonId} ingested into vector DB", ['chunks' => $response->json('chunks_stored', 0)]);
                $lesson->ingested = true;
                $lesson->save();
            } else {
                Log::warning("Ingest failed for lesson {$this->lessonId}", ['status' => $response->status()]);
            }
        } catch (\Exception $e) {
            Log::error("IngestLessonJob error", ['lesson' => $this->lessonId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }
}
