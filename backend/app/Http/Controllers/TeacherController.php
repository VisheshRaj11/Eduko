<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Progress;
use App\Models\Lesson;
use App\Services\TwilioService;
use App\Jobs\TranslateContentJob;

class TeacherController extends Controller
{
    protected TwilioService $twilio;
    protected string $aiUrl;

    public function __construct(TwilioService $twilio)
    {
        $this->twilio = $twilio;
        $this->aiUrl  = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');
    }

    /**
     * GET /api/teacher/dashboard
     */
    public function dashboard(Request $request)
    {
        [$grades, $subjects] = $this->getTeacherFilters($request);

        $studentQuery = Student::query();
        if (empty($grades)) {
            $totalStudents = 0;
            $studentUserIds = [];
        } else {
            $studentQuery->whereIn('grade_level', $grades);
            $totalStudents = $studentQuery->count();
            $studentUserIds = $studentQuery->pluck('user_id')->all();
        }

        $avgScore = empty($studentUserIds) ? 0 : Progress::whereIn('type', ['quiz', 'ai_quiz'])
            ->whereIn('user_id', $studentUserIds)
            ->avg('score') ?? 0;

        $lessonsPublished = Lesson::where(function($q) use ($request) {
            $q->where('teacher_id', (string) $request->user()->_id)
              ->orWhere('created_by', (string) $request->user()->_id);
        })->count();

        $atRisk = 0;
        if (!empty($studentUserIds)) {
            $scoresByUser = Progress::whereIn('type', ['quiz', 'ai_quiz'])
                ->whereIn('user_id', $studentUserIds)
                ->get()
                ->groupBy('user_id');
            foreach ($scoresByUser as $uid => $progresses) {
                if ($progresses->avg('score') < 60) {
                    $atRisk++;
                }
            }
        }

        $lessons = Lesson::where('teacher_id', (string) $request->user()->_id)
            ->orWhere('created_by', (string) $request->user()->_id)
            ->select('_id', 'title')
            ->get();

        return response()->json([
            'stats' => [
                'total_students'    => $totalStudents,
                'avg_score'         => round($avgScore, 1),
                'lessons_published' => $lessonsPublished,
                'at_risk'           => $atRisk,
            ],
            'subject_performance' => $this->getSubjectPerformance($studentUserIds, $subjects),
            'weekly_activity'     => $this->getWeeklyActivity($studentUserIds),
            'topic_heatmap'       => $this->getTopicHeatmap(),
            'struggling_students' => $this->getStrugglingStudents($studentUserIds),
            'ai_suggestions'      => $this->getAISuggestions($request->user()->_id),
            'lessons'             => $lessons,
        ]);
    }

    /**
     * GET /api/teacher/analytics
     */
    public function analytics(Request $request)
    {
        [$grades, $subjects] = $this->getTeacherFilters($request);
        
        $studentQuery = Student::query();
        if (!empty($grades)) {
            $studentQuery->whereIn('grade_level', $grades);
        }
        $studentUserIds = $studentQuery->pluck('user_id')->all();

        return response()->json([
            'subject_scores'      => $this->getSubjectPerformance($studentUserIds, $subjects),
            'attendance_by_week'  => $this->getWeeklyActivity($studentUserIds),
            'struggling_students' => $this->getStrugglingStudents($studentUserIds),
            'topic_heatmap'       => $this->getTopicHeatmap(),
        ]);
    }

    /**
     * POST /api/teacher/reingest-all
     * Re-index every lesson in the database into the vector store.
     * Use this to fix lessons uploaded before the AI service was working.
     */
    public function reingestAll(Request $request)
    {
        $lessons = Lesson::all();
        $results = ['total' => count($lessons), 'success' => 0, 'skipped' => 0, 'failed' => 0, 'details' => []];

        foreach ($lessons as $lesson) {
            $content = $lesson->content ?? '';

            // Skip PDF placeholders that have no extracted text yet
            if (str_starts_with(trim($content), '[PDF]')) {
                $pdfPath = null;
                if (preg_match('/stored at:\s*(.+)$/i', $content, $m)) {
                    $pdfPath = trim($m[1]);
                }

                if ($pdfPath) {
                    $ok = $this->ingestPdf($lesson, $pdfPath);
                    if ($ok) { $results['success']++; } else { $results['failed']++; }
                    $results['details'][] = ['id' => (string)$lesson->_id, 'title' => $lesson->title, 'status' => $ok ? 'ok' : 'failed'];
                } else {
                    $results['skipped']++;
                    $results['details'][] = ['id' => (string)$lesson->_id, 'title' => $lesson->title, 'status' => 'skipped (no PDF path)'];
                }
                continue;
            }

            if (strlen(trim($content)) < 20) {
                $results['skipped']++;
                $results['details'][] = ['id' => (string)$lesson->_id, 'title' => $lesson->title, 'status' => 'skipped (no content)'];
                continue;
            }

            [$ok] = $this->ingestText($lesson, $content);
            if ($ok) {
                $lesson->ingested = true;
                $lesson->save();
                $results['success']++;
            } else {
                $results['failed']++;
            }
            $results['details'][] = ['id' => (string)$lesson->_id, 'title' => $lesson->title, 'status' => $ok ? 'ok' : 'failed'];
        }

        return response()->json($results);
    }

    /**
     * POST /api/teacher/upload-lesson
     * Saves lesson, then immediately ingests content into the AI vector DB.
     */
    public function uploadLesson(Request $request)
    {
        $hasPdf = $request->hasFile('pdf');

        $request->validate([
            'title'       => 'required|string|max:200',
            'subject'     => 'required|string|max:100',
            'grade_level' => 'required|integer|min:1|max:12',
            'language'    => 'nullable|string|in:en,hi,pa',
            'content'     => $hasPdf ? 'nullable|string' : 'required|string|min:10',
            'pdf'         => $hasPdf ? 'required|file|mimes:pdf|max:20480' : 'nullable',
        ]);

        $pdfPath  = null;
        $content  = null;

        if ($hasPdf) {
            $file    = $request->file('pdf');
            $pdfPath = $file->store('lessons/pdfs', 'public');
            $content = '[PDF] ' . $file->getClientOriginalName() . ' — stored at: ' . $pdfPath;
        } else {
            $content = $request->input('content');
        }

        // Save lesson to database
        $lesson = Lesson::create([
            'title'       => $request->input('title'),
            'content'     => $content,
            'subject'     => $request->input('subject'),
            'grade_level' => (int) $request->input('grade_level'),
            'language'    => $request->input('language', 'en'),
            'teacher_id'  => (string) $request->user()->_id,
            'status'      => 'published',
            'translations'=> [],
        ]);

        // Dispatch translation in background (non-critical)
        TranslateContentJob::dispatch((string) $lesson->_id, ['hi', 'pa']);

        // ── Immediately ingest into vector DB (no queue needed) ──────────────
        $ingested = false;
        $chunks   = 0;

        if ($hasPdf) {
            // For PDFs: send the file to AI service for text extraction + ingestion
            $ingested = $this->ingestPdf($lesson, $pdfPath);
            $chunks   = $ingested ? 1 : 0;
        } else {
            // For text: ingest directly
            [$ingested, $chunks] = $this->ingestText($lesson, $content);
        }

        if ($ingested) {
            $lesson->ingested = true;
            $lesson->save();
        }

        return response()->json([
            'lesson'   => $lesson->toArray(),
            'ingested' => $ingested,
            'chunks'   => $chunks,
            'message'  => $ingested
                ? "Lesson published and added to AI knowledge base ({$chunks} chunks indexed)."
                : 'Lesson published. AI indexing could not complete — the AI service may be offline.',
        ], 201);
    }

    /**
     * Ingest plain-text content directly into the AI vector store.
     */
    private function ingestText(Lesson $lesson, string $content): array
    {
        try {
            $response = Http::timeout(60)->post("{$this->aiUrl}/ai/ingest", [
                'lesson_id' => (string) $lesson->_id,
                'title'     => $lesson->title,
                'content'   => $content,
                'subject'   => $lesson->subject   ?? 'General',
                'language'  => $lesson->language  ?? 'en',
                'grade'     => $lesson->grade_level ?? 8,
            ]);

            if ($response->successful()) {
                $chunks = $response->json('chunks_ingested', 0);
                Log::info("Lesson {$lesson->_id} ingested", ['chunks' => $chunks, 'subject' => $lesson->subject]);
                return [true, $chunks];
            }

            Log::warning("Ingest failed for lesson {$lesson->_id}", ['status' => $response->status(), 'body' => $response->body()]);
            return [false, 0];

        } catch (\Exception $e) {
            Log::error("ingestText error: " . $e->getMessage());
            return [false, 0];
        }
    }

    /**
     * Send PDF file to AI service for extraction + ingestion in one call.
     */
    private function ingestPdf(Lesson $lesson, string $pdfPath): bool
    {
        try {
            $absolutePath = Storage::disk('public')->path($pdfPath);

            if (!file_exists($absolutePath)) {
                Log::warning("ingestPdf: file not found at {$absolutePath}");
                return false;
            }

            // Step 1: Extract text from PDF via AI service
            $extractResponse = Http::timeout(120)
                ->attach('image', file_get_contents($absolutePath), basename($absolutePath))
                ->post("{$this->aiUrl}/ai/extract-pdf-text");

            if (!$extractResponse->successful()) {
                Log::warning("PDF extraction failed for lesson {$lesson->_id}", ['status' => $extractResponse->status()]);
                return false;
            }

            $extractedText = $extractResponse->json('text', '');

            if (strlen(trim($extractedText)) < 20) {
                Log::warning("PDF extraction returned empty text for lesson {$lesson->_id}");
                return false;
            }

            // Step 2: Update lesson content with the extracted text
            $lesson->content = $extractedText;
            $lesson->save();

            // Step 3: Ingest extracted text
            [$ok] = $this->ingestText($lesson, $extractedText);
            return $ok;

        } catch (\Exception $e) {
            Log::error("ingestPdf error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * POST /api/teacher/send-sms
     */
    public function sendSMS(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|min:5|max:320',
            'target'  => 'nullable|string|in:all,class',
            'grade'   => 'nullable|integer',
        ]);

        [$teacherGrades, $teacherSubjects] = $this->getTeacherFilters($request);

        $query = Student::with('user');
        
        if (!empty($teacherGrades)) {
            $query->whereIn('grade_level', $teacherGrades);
        }

        if (($validated['target'] ?? null) === 'class' && isset($validated['grade'])) {
            $query->where('grade_level', (int) $validated['grade']);
        }

        $students  = $query->get();
        
        // Fetch phone numbers directly from User collection to avoid relation type mismatch
        $userIds = $students->pluck('user_id')->all();
        $users = \App\Models\User::whereIn('_id', $userIds)->whereNotNull('phone')->get();
        $phones = $users->pluck('phone')->filter()->values()->all();

        if (empty($phones)) {
            return response()->json(['message' => 'No students with phone numbers found.', 'sent' => 0]);
        }

        $results  = $this->twilio->sendBulkSMS($phones, $validated['message']);
        $sentCount = count(array_filter($results));

        return response()->json([
            'message' => "SMS sent to {$sentCount} students via Twilio.",
            'sent'    => $sentCount,
            'total'   => count($phones),
            'failed'  => count($phones) - $sentCount,
        ]);
    }

    // ── Assigned Tasks ───────────────────────────────────────

    public function getStudents(Request $request)
    {
        [$teacherGrades, $teacherSubjects] = $this->getTeacherFilters($request);
        
        $query = Student::query();
        if (!empty($teacherGrades)) {
            $query->whereIn('grade_level', $teacherGrades);
        }
        
        $students = $query->with('user:id,avatar')->get(['_id', 'user_id', 'name', 'grade_level', 'phone']);
        
        $students->transform(function ($student) {
            $student->avatar = $student->user ? $student->user->avatar : null;
            return $student;
        });

        return response()->json($students);
    }

    public function getAssignedTasks(Request $request)
    {
        $userId = (string) $request->user()->_id;
        $tasks = \App\Models\AssignedTask::with('student')
            ->where('teacher_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($tasks);
    }

    public function assignTask(Request $request)
    {
        $validated = $request->validate([
            'student_id'       => 'required|string',
            'task_description' => 'required|string|max:1000'
        ]);

        $userId = (string) $request->user()->_id;

        $task = \App\Models\AssignedTask::create([
            'teacher_id'       => $userId,
            'student_id'       => $validated['student_id'],
            'task_description' => $validated['task_description'],
            'is_completed'     => false,
        ]);

        return response()->json(['message' => 'Task assigned successfully', 'task' => $task]);
    }

    // ── Private analytics helpers ──────────────────────────

    private function getTeacherFilters(Request $request): array
    {
        $userId = (string) $request->user()->_id;
        $lessons = Lesson::where('teacher_id', $userId)->orWhere('created_by', $userId)->get();
        $grades = $lessons->pluck('grade_level')->filter()->unique()->map(fn($g) => (int)$g)->values()->all();
        $subjects = $lessons->pluck('subject')->filter()->unique()->values()->all();
        return [$grades, $subjects];
    }

    private function getSubjectPerformance(array $studentUserIds = [], array $teacherSubjects = []): array
    {
        $colors = ['#8B5CF6', '#A3E635', '#F472B6', '#60A5FA', '#34D399'];
        $result = [];

        if (!empty($studentUserIds)) {
            $scoresBySubject = Progress::whereIn('type', ['quiz', 'ai_quiz'])
                ->whereIn('user_id', $studentUserIds)
                ->get()
                ->groupBy(function($item) {
                    return ucfirst(strtolower($item->subject)); // Normalize 'english' to 'English'
                });
                
            $i = 0;
            foreach ($scoresBySubject as $subj => $progresses) {
                $avg = $progresses->avg('score') ?? 0;
                $result[] = ['subject' => $subj, 'score' => round($avg, 1), 'fill' => $colors[$i % count($colors)]];
                $i++;
            }
        }

        if (empty($result)) {
            $fallback = empty($teacherSubjects) ? ['Mathematics', 'Science', 'Hindi', 'English', 'Social Studies'] : array_slice($teacherSubjects, 0, 5);
            foreach ($fallback as $i => $subj) {
                $result[] = ['subject' => ucfirst(strtolower($subj)), 'score' => 0, 'fill' => $colors[$i % count($colors)]];
            }
        }

        return $result;
    }

    private function getWeeklyActivity(array $studentUserIds = []): array
    {
        $days = ['Mon' => 0, 'Tue' => 0, 'Wed' => 0, 'Thu' => 0, 'Fri' => 0];
        
        if (!empty($studentUserIds)) {
            $sessions = \App\Models\Session::whereIn('student_id', $studentUserIds)
                ->where('scheduled_time', '>=', now()->startOfWeek())
                ->get();
            foreach ($sessions as $session) {
                if ($session->scheduled_time) {
                    $day = $session->scheduled_time->format('D');
                    if (isset($days[$day])) {
                        $days[$day]++;
                    }
                }
            }
        }

        $result = [];
        foreach ($days as $day => $count) {
            $result[] = ['day' => $day, 'students' => $count];
        }
        return $result;
    }

    private function getTopicHeatmap(): array
    {
        return [
            ['topic' => 'Fractions',     'difficulty' => 78],
            ['topic' => 'Photosynthesis','difficulty' => 42],
            ['topic' => 'Algebra',       'difficulty' => 75],
            ['topic' => 'Grammar',       'difficulty' => 55],
            ['topic' => 'Water Cycle',   'difficulty' => 30],
        ];
    }

    private function getStrugglingStudents(array $studentUserIds = []): array
    {
        $q = Progress::where(function($q) {
            $q->where(function($sub) {
                $sub->where('type', 'quiz')->where('score', '<', 50);
            })->orWhere(function($sub) {
                $sub->where('type', 'ai_quiz')->where('ai_rating', 'weak');
            });
        });

        if (!empty($studentUserIds)) {
            $q->whereIn('user_id', $studentUserIds);
        }
        
        return $q->orderBy('score')
            ->limit(5)
            ->get()
            ->map(function ($p) {
                $student = Student::where('user_id', $p->user_id)->first();
                return [
                    'name'    => $student?->name ?? 'Student',
                    'subject' => $p->subject ?? 'General',
                    'score'   => round($p->score),
                    'phone'   => $student?->phone,
                ];
            })
            ->all();
    }

    private function getAISuggestions(string $userId): string
    {
        $teacher = Teacher::where('user_id', $userId)->first();
        if ($teacher && !empty($teacher->ai_suggestions)) {
            return $teacher->ai_suggestions;
        }

        return "No AI suggestions yet. Select a lesson (optional), type a prompt, and click **Get Suggestions** to generate actionable insights.";
    }

    /**
     * POST /api/teacher/generate-suggestions
     */
    public function generateAISuggestions(Request $request)
    {
        $validated = $request->validate([
            'prompt' => 'nullable|string|max:1000',
            'lesson_id' => 'nullable|string|max:100',
        ]);

        $userId = (string) $request->user()->_id;
        $teacher = Teacher::where('user_id', $userId)->first();
        if (!$teacher) {
            return response()->json(['message' => 'Teacher profile not found.'], 404);
        }

        [$grades, $subjects] = $this->getTeacherFilters($request);
        
        $studentQuery = Student::query();
        if (!empty($grades)) {
            $studentQuery->whereIn('grade_level', $grades);
        }
        $studentUserIds = $studentQuery->pluck('user_id')->all();
        
        $strugglingStudents = $this->getStrugglingStudents($studentUserIds);

        $context = "You are an expert AI teacher assistant. You are analyzing the performance of a class. ";
        
        if (!empty($validated['lesson_id'])) {
            $lesson = Lesson::find($validated['lesson_id']);
            if ($lesson) {
                $context .= "The teacher is specifically asking about the lesson titled '{$lesson->title}'. ";
            }
        }

        $context .= "Here are the students struggling the most (scores < 60): " . json_encode($strugglingStudents) . ". ";
        $context .= "Assume a rural school setting with limited resources (e.g., no projectors or advanced technology). Suggest activities requiring minimal or low-cost materials. ";
        $context .= "Generate actionable, specific advice to help the teacher improve their class's performance. ";
        if (!empty($validated['prompt'])) {
            $context .= "The teacher specifically asked: " . $validated['prompt'] . ". ";
        }
        
        $context .= "CRITICAL: You MUST format your entire response using Markdown. Use bolding, bullet points, and headers as appropriate.";

        try {
            $response = Http::timeout(60)->post("{$this->aiUrl}/ai/chat", [
                'message' => $context,
                'user_id' => $userId,
            ]);

            if ($response->successful()) {
                $text = $response->json('response', '');
                
                $teacher->ai_suggestions = $text;
                $teacher->save();

                return response()->json([
                    'suggestions' => $text,
                    'message' => 'AI suggestions generated successfully.'
                ]);
            }

            return response()->json(['message' => 'Failed to generate suggestions from AI service.'], 500);

        } catch (\Exception $e) {
            Log::error("generateAISuggestions error: " . $e->getMessage());
            return response()->json(['message' => 'AI service error.'], 500);
        }
    }
}
