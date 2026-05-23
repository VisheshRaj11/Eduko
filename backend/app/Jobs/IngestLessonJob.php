<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\Lesson;

class IngestLessonJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct(protected string $lessonId) {}

    public function handle(): void
    {
        $lesson = Lesson::find($this->lessonId);
        if (!$lesson) {
            Log::warning("IngestLessonJob: Lesson {$this->lessonId} not found.");
            return;
        }

        $content = $lesson->content ?? '';

        // If the lesson is a PDF, extract readable text from it
        if (str_starts_with(trim($content), '[PDF]')) {
            $content = $this->extractPdfText($content);
            if (!$content) {
                Log::warning("IngestLessonJob: Could not extract text from PDF for lesson {$this->lessonId}");
                return;
            }
        }

        if (strlen(trim($content)) < 20) {
            Log::warning("IngestLessonJob: Lesson {$this->lessonId} has no usable content to ingest.");
            return;
        }

        $aiUrl = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');

        try {
            $response = Http::timeout(60)->post("{$aiUrl}/ai/ingest", [
                'lesson_id' => (string) $lesson->_id,
                'title'     => $lesson->title,
                'content'   => $content,
                'subject'   => $lesson->subject   ?? 'General',
                'language'  => $lesson->language  ?? 'en',
                'grade'     => $lesson->grade_level ?? 8,
            ]);

            if ($response->successful()) {
                $chunks = $response->json('chunks_ingested', 0);
                Log::info("Lesson {$this->lessonId} ingested into vector DB", [
                    'chunks'  => $chunks,
                    'subject' => $lesson->subject,
                ]);
                $lesson->ingested = true;
                $lesson->save();
            } else {
                Log::warning("Ingest failed for lesson {$this->lessonId}", ['status' => $response->status(), 'body' => $response->body()]);
            }
        } catch (\Exception $e) {
            Log::error("IngestLessonJob error", ['lesson' => $this->lessonId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Extract plain text from a stored PDF using the Python AI service endpoint.
     * Falls back to null if extraction fails.
     */
    private function extractPdfText(string $contentPlaceholder): ?string
    {
        // Parse the stored path from the placeholder: "[PDF] filename.pdf — stored at: lessons/pdfs/xxx.pdf"
        if (!preg_match('/stored at:\s*(.+)$/i', $contentPlaceholder, $m)) {
            return null;
        }

        $relativePath = trim($m[1]);
        $absolutePath = Storage::disk('public')->path($relativePath);

        if (!file_exists($absolutePath)) {
            Log::warning("IngestLessonJob: PDF not found at {$absolutePath}");
            return null;
        }

        $aiUrl = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');

        try {
            // Use the OCR endpoint to extract text from the PDF
            $response = Http::timeout(60)
                ->attach('image', file_get_contents($absolutePath), basename($absolutePath))
                ->post("{$aiUrl}/ai/extract-pdf-text");

            if ($response->successful()) {
                return $response->json('text', '');
            }
        } catch (\Exception $e) {
            Log::warning("PDF text extraction via AI service failed: " . $e->getMessage());
        }

        return null;
    }
}
