<?php

namespace App\Http\Controllers;

use App\Jobs\IngestLessonJob;
use App\Jobs\TranslateContentJob;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    // ──────────────────────────────────────────────────────────────────────────
    // GET /lessons  — paginated list with filters
    // ──────────────────────────────────────────────────────────────────────────
    public function index(Request $r): JsonResponse
    {
        $query = Lesson::where('is_deleted', '!=', true);

        // Filters
        if ($subject = $r->query('subject')) {
            $query->where('subject', $subject);
        }

        if ($grade = $r->query('grade_level')) {
            $query->where('grade_level', $grade);
        }

        if ($lang = $r->query('language')) {
            $query->where('language', $lang);
        }

        if ($diff = $r->query('difficulty')) {
            $query->where('difficulty', $diff);
        }

        if ($search = $r->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'regex', "/{$search}/i")
                  ->orWhere('subject', 'regex', "/{$search}/i");
            });
        }

        $perPage  = min((int) $r->query('per_page', 15), 50);
        $lessons  = $query->orderByDesc('created_at')->paginate($perPage);

        $items = collect($lessons->items())->map(fn($l) => [
            'id'          => (string) $l->_id,
            'title'       => $l->title,
            'subject'     => $l->subject,
            'grade_level' => $l->grade_level,
            'language'    => $l->language,
            'difficulty'  => $l->difficulty,
            'created_by'  => (string) $l->created_by,
            'created_at'  => $l->created_at?->toISOString(),
        ]);

        return response()->json([
            'data'         => $items,
            'current_page' => $lessons->currentPage(),
            'last_page'    => $lessons->lastPage(),
            'per_page'     => $lessons->perPage(),
            'total'        => $lessons->total(),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /lessons/{id}  — single lesson with full content
    // ──────────────────────────────────────────────────────────────────────────
    public function show(Request $r, $id): JsonResponse
    {
        $lesson = Lesson::where('_id', $id)->where('is_deleted', '!=', true)->first();

        if (! $lesson) {
            return response()->json(['message' => 'Lesson not found.'], 404);
        }

        return response()->json([
            'id'             => (string) $lesson->_id,
            'title'          => $lesson->title,
            'subject'        => $lesson->subject,
            'grade_level'    => $lesson->grade_level,
            'language'       => $lesson->language,
            'difficulty'     => $lesson->difficulty,
            'content'        => $lesson->content,
            'content_blocks' => $lesson->content_blocks ?? [],
            'resources'      => $lesson->resources ?? [],
            'translations'   => $lesson->translations ?? [],
            'created_by'     => (string) $lesson->created_by,
            'created_at'     => $lesson->created_at?->toISOString(),
            'updated_at'     => $lesson->updated_at?->toISOString(),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /lessons  — create lesson (teacher)
    // ──────────────────────────────────────────────────────────────────────────
    public function store(Request $r): JsonResponse
    {
        $data = $r->validate([
            'title'          => 'required|string|max:200',
            'content'        => 'required|string',
            'subject'        => 'required|string|max:100',
            'grade_level'    => 'required|string|max:20',
            'language'       => 'nullable|string|max:10',
            'difficulty'     => 'nullable|in:easy,medium,hard',
            'resources'      => 'nullable|array',
            'content_blocks' => 'nullable|array',
        ]);

        $user = $r->user();

        $lesson = Lesson::create([
            'title'          => $data['title'],
            'content'        => $data['content'],
            'subject'        => $data['subject'],
            'grade_level'    => $data['grade_level'],
            'language'       => $data['language'] ?? 'en',
            'difficulty'     => $data['difficulty'] ?? 'medium',
            'resources'      => $data['resources'] ?? [],
            'content_blocks' => $data['content_blocks'] ?? [],
            'translations'   => [],
            'created_by'     => (string) $user->_id,
            'is_deleted'     => false,
        ]);

        $lessonId = (string) $lesson->_id;

        TranslateContentJob::dispatch($lessonId, ['hi', 'pa']);
        IngestLessonJob::dispatch($lessonId);

        return response()->json([
            'message' => 'Lesson created. Translation and ingestion queued.',
            'lesson'  => [
                'id'          => $lessonId,
                'title'       => $lesson->title,
                'subject'     => $lesson->subject,
                'grade_level' => $lesson->grade_level,
                'language'    => $lesson->language,
                'difficulty'  => $lesson->difficulty,
                'created_at'  => $lesson->created_at?->toISOString(),
            ],
        ], 201);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /lessons/{id}  — update lesson, re-ingest
    // ──────────────────────────────────────────────────────────────────────────
    public function update(Request $r, $id): JsonResponse
    {
        $lesson = Lesson::where('_id', $id)->where('is_deleted', '!=', true)->first();

        if (! $lesson) {
            return response()->json(['message' => 'Lesson not found.'], 404);
        }

        // Only creator can update
        $user = $r->user();
        if ((string) $lesson->created_by !== (string) $user->_id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $r->validate([
            'title'          => 'sometimes|string|max:200',
            'content'        => 'sometimes|string',
            'subject'        => 'sometimes|string|max:100',
            'grade_level'    => 'sometimes|string|max:20',
            'language'       => 'sometimes|string|max:10',
            'difficulty'     => 'sometimes|in:easy,medium,hard',
            'resources'      => 'sometimes|array',
            'content_blocks' => 'sometimes|array',
        ]);

        $lesson->fill($data);
        $lesson->save();

        // Re-run translation and ingestion
        TranslateContentJob::dispatch($id, ['hi', 'pa']);
        IngestLessonJob::dispatch($id);

        return response()->json([
            'message' => 'Lesson updated. Re-translation and re-ingestion queued.',
            'lesson'  => [
                'id'          => (string) $lesson->_id,
                'title'       => $lesson->title,
                'subject'     => $lesson->subject,
                'grade_level' => $lesson->grade_level,
                'language'    => $lesson->language,
                'difficulty'  => $lesson->difficulty,
                'updated_at'  => $lesson->updated_at?->toISOString(),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DELETE /lessons/{id}  — soft delete
    // ──────────────────────────────────────────────────────────────────────────
    public function destroy(Request $r, $id): JsonResponse
    {
        $lesson = Lesson::where('_id', $id)->where('is_deleted', '!=', true)->first();

        if (! $lesson) {
            return response()->json(['message' => 'Lesson not found.'], 404);
        }

        $user = $r->user();
        if ((string) $lesson->created_by !== (string) $user->_id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $lesson->is_deleted  = true;
        $lesson->deleted_at  = now();
        $lesson->save();

        return response()->json(['message' => 'Lesson deleted successfully.']);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /lessons/offline  — full lesson list for offline caching (no pagination)
    // ──────────────────────────────────────────────────────────────────────────
    public function offline(Request $r): JsonResponse
    {
        $query = Lesson::where('is_deleted', '!=', true);

        // Allow filtering by grade for smaller payload
        if ($grade = $r->query('grade_level')) {
            $query->where('grade_level', $grade);
        }

        if ($lang = $r->query('language')) {
            $query->where('language', $lang);
        }

        $lessons = $query->orderByDesc('updated_at')->get();

        $payload = $lessons->map(fn($l) => [
            'id'             => (string) $l->_id,
            'title'          => $l->title,
            'subject'        => $l->subject,
            'grade_level'    => $l->grade_level,
            'language'       => $l->language,
            'difficulty'     => $l->difficulty,
            'content'        => $l->content,
            'content_blocks' => $l->content_blocks ?? [],
            'resources'      => $l->resources ?? [],
            'translations'   => $l->translations ?? [],
            'updated_at'     => $l->updated_at?->toISOString(),
        ]);

        return response()->json([
            'lessons'     => $payload,
            'total'       => $payload->count(),
            'cached_at'   => now()->toISOString(),
        ])->header('Content-Encoding', 'identity');  // Caller can gzip
    }
}
