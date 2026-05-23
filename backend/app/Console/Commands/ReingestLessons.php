<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use App\Models\Lesson;

class ReingestLessons extends Command
{
    protected $signature   = 'ai:reingest {--id= : Reingest a specific lesson ID}';
    protected $description = 'Re-index all lessons (or one lesson) into the AI vector database';

    public function handle(): int
    {
        $aiUrl = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');

        $lessons = $this->option('id')
            ? Lesson::where('_id', $this->option('id'))->get()
            : Lesson::all();

        if ($lessons->isEmpty()) {
            $this->error('No lessons found.');
            return 1;
        }

        $this->info("Found {$lessons->count()} lessons. Starting ingestion...\n");
        $ok = 0; $failed = 0; $skipped = 0;

        foreach ($lessons as $lesson) {
            $content = $lesson->content ?? '';
            $title   = $lesson->title;
            $subject = $lesson->subject ?? 'General';

            // ── PDF: extract text first ────────────────────────────────────
            if (str_starts_with(trim($content), '[PDF]')) {
                $pdfPath = null;
                if (preg_match('/stored at:\s*(.+)$/i', $content, $m)) {
                    $pdfPath = trim($m[1]);
                }

                if (!$pdfPath) {
                    $this->warn("  SKIP [{$title}] — PDF path not found in content");
                    $skipped++;
                    continue;
                }

                $absPath = Storage::disk('public')->path($pdfPath);
                if (!file_exists($absPath)) {
                    $this->warn("  SKIP [{$title}] — PDF file missing at {$absPath}");
                    $skipped++;
                    continue;
                }

                $this->line("  Extracting PDF text: {$title}...");
                try {
                    $extractRes = Http::timeout(120)
                        ->attach('image', file_get_contents($absPath), basename($absPath))
                        ->post("{$aiUrl}/ai/extract-pdf-text");

                    if (!$extractRes->successful()) {
                        $this->error("  FAIL [{$title}] — PDF extraction failed ({$extractRes->status()})");
                        $failed++;
                        continue;
                    }

                    $content = $extractRes->json('text', '');
                    if (strlen(trim($content)) < 20) {
                        $this->warn("  SKIP [{$title}] — PDF extraction returned no text");
                        $skipped++;
                        continue;
                    }

                    // Update lesson content with extracted text
                    $lesson->content = $content;
                    $lesson->save();
                    $this->line("  ✓ Extracted " . strlen($content) . " chars from PDF");

                } catch (\Exception $e) {
                    $this->error("  FAIL [{$title}] — {$e->getMessage()}");
                    $failed++;
                    continue;
                }
            }

            if (strlen(trim($content)) < 20) {
                $this->warn("  SKIP [{$title}] — no content");
                $skipped++;
                continue;
            }

            // ── Ingest into ChromaDB ──────────────────────────────────────
            try {
                $res = Http::timeout(60)->post("{$aiUrl}/ai/ingest", [
                    'lesson_id' => (string) $lesson->_id,
                    'title'     => $title,
                    'content'   => $content,
                    'subject'   => $subject,
                    'language'  => $lesson->language  ?? 'en',
                    'grade'     => $lesson->grade_level ?? 8,
                ]);

                if ($res->successful()) {
                    $chunks = $res->json('chunks_ingested', 0);
                    $this->info("  ✓ [{$title}] ({$subject}) — {$chunks} chunks indexed");
                    $lesson->ingested = true;
                    $lesson->save();
                    $ok++;
                } else {
                    $this->error("  FAIL [{$title}] — HTTP {$res->status()}: {$res->body()}");
                    $failed++;
                }
            } catch (\Exception $e) {
                $this->error("  FAIL [{$title}] — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Done! ✓ {$ok} ingested | ✗ {$failed} failed | – {$skipped} skipped");
        return 0;
    }
}
