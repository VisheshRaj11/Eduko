<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Progress;
use App\Models\LearningPlan;
use App\Models\Lesson;
use App\Jobs\GenerateLearningPlanJob;
use Carbon\Carbon;

class StudentController extends Controller
{
    /**
     * GET /api/dashboard
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $userId = (string) $user->_id;

        // Get student profile
        $student = Student::where('user_id', $userId)->first();

        // Recent quiz progress
        $recentProgress = Progress::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Calculate streak (consecutive days with activity)
        $streak = $this->calculateStreak($userId);

        // Lessons completed
        $lessonsCompleted = Progress::where('user_id', $userId)
            ->where('type', 'lesson')
            ->where('completed', true)
            ->count();

        // Quizzes taken
        $quizzesTaken = Progress::where('user_id', $userId)
            ->where('type', 'quiz')
            ->count();

        // Recent lessons
        $recentLessons = Lesson::orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function($lesson) use ($userId) {
                $progress = Progress::where('user_id', $userId)
                    ->where('lesson_id', (string) $lesson->_id)
                    ->first();
                return [
                    '_id'      => (string) $lesson->_id,
                    'title'    => $lesson->title,
                    'subject'  => $lesson->subject,
                    'progress' => $progress ? $progress->completion_pct : 0,
                ];
            });

        // Today's tasks from learning plan
        $plan = LearningPlan::where('user_id', $userId)->orderBy('created_at', 'desc')->first();
        $todayTasks = $this->getTodayTasks($plan);

        return response()->json([
            'streak'             => $student?->streak ?? $streak,
            'points'             => $student?->points ?? 0,
            'lessons_completed'  => $lessonsCompleted,
            'quizzes_taken'      => $quizzesTaken,
            'recent_lessons'     => $recentLessons,
            'today_tasks'        => $todayTasks,
            'badges'             => $student?->badges ?? [],
            'weekly_progress'    => $this->getWeeklyProgress($userId),
        ]);
    }

    /**
     * GET /api/learning-plan
     */
    public function learningPlan(Request $request)
    {
        $userId = (string) $request->user()->_id;
        $plan = LearningPlan::where('user_id', $userId)->orderBy('created_at', 'desc')->first();

        if (!$plan) {
            // Dispatch async plan generation
            GenerateLearningPlanJob::dispatch($userId);
            return response()->json([
                'status'  => 'generating',
                'message' => 'Your personalized plan is being generated. Check back in a moment.',
                'plan'    => null,
            ], 202);
        }

        return response()->json($plan->toArray());
    }

    /**
     * POST /api/quiz/submit
     */
    public function submitQuiz(Request $request)
    {
        $validated = $request->validate([
            'quiz_id' => 'required|string',
            'score'   => 'required|numeric|min:0|max:100',
            'answers' => 'required|array',
        ]);

        $user   = $request->user();
        $userId = (string) $user->_id;

        $correct = collect($validated['answers'])->where('correct', true)->count();
        $total   = count($validated['answers']);

        // Save progress
        Progress::create([
            'user_id'        => $userId,
            'quiz_id'        => $validated['quiz_id'],
            'type'           => 'quiz',
            'score'          => $validated['score'],
            'correct'        => $correct,
            'total'          => $total,
            'answers'        => $validated['answers'],
            'completed'      => true,
            'completion_pct' => $validated['score'],
        ]);

        // Update student points & streak
        $pointsEarned = $correct * 10;
        $student      = Student::where('user_id', $userId)->first();

        if ($student) {
            $student->points  = ($student->points ?? 0) + $pointsEarned;
            $student->streak  = $this->calculateStreak($userId);
            // Badge logic
            $newBadge = null;
            if ($validated['score'] >= 90 && !in_array('🏆 Perfect Score', $student->badges ?? [])) {
                $student->badges = array_merge($student->badges ?? [], ['🏆 Perfect Score']);
                $newBadge = '🏆 Perfect Score';
            } elseif ($student->streak >= 7 && !in_array('🔥 Week Streak', $student->badges ?? [])) {
                $student->badges = array_merge($student->badges ?? [], ['🔥 Week Streak']);
                $newBadge = '🔥 Week Streak';
            }
            $student->save();
        }

        // Regenerate AI learning plan async
        GenerateLearningPlanJob::dispatch($userId);

        return response()->json([
            'score'         => $validated['score'],
            'correct'       => $correct,
            'total'         => $total,
            'points_earned' => $pointsEarned,
            'new_badge'     => $newBadge ?? null,
            'message'       => $validated['score'] >= 70 ? 'Great job! 🎉' : 'Keep practicing! You can do it.',
        ]);
    }

    /**
     * GET /api/progress
     */
    public function progress(Request $request)
    {
        $userId = (string) $request->user()->_id;
        $progressData = Progress::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->groupBy('subject');

        return response()->json($progressData);
    }

    /**
     * GET /api/lessons/{id}/download
     */
    public function downloadLesson(Request $request, $id)
    {
        $lesson = Lesson::find($id);
        if (!$lesson) return response()->json(['error' => 'Lesson not found'], 404);

        return response()->json([
            'lesson'          => $lesson->toArray(),
            'cached_at'       => now()->toISOString(),
            'offline_version' => 1,
        ]);
    }

    // ── Private helpers ────────────────────────────────────────

    private function calculateStreak(string $userId): int
    {
        $dates = Progress::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->pluck('created_at')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->unique()
            ->values();

        if ($dates->isEmpty()) return 0;

        $streak = 0;
        $today  = Carbon::today()->toDateString();
        $checkDate = $today;

        foreach ($dates as $date) {
            if ($date === $checkDate || $date === Carbon::parse($checkDate)->subDay()->toDateString()) {
                $streak++;
                $checkDate = $date;
            } else {
                break;
            }
        }
        return $streak;
    }

    private function getTodayTasks(?object $plan): array
    {
        if (!$plan || !isset($plan->plan)) return [
            'Review yesterday\'s lessons',
            'Complete one quiz',
            'Ask AI Tutor a question',
        ];

        $dayName = strtolower(now()->format('l'));
        $days    = $plan->plan['days'] ?? [];

        foreach ($days as $day) {
            if (strtolower($day['day'] ?? '') === $dayName) {
                return collect($day['tasks'] ?? [])->pluck('topic')->filter()->values()->all();
            }
        }
        return ['No tasks scheduled for today. Take a revision day!'];
    }

    private function getWeeklyProgress(string $userId): array
    {
        $weeks = [];
        for ($i = 6; $i >= 0; $i--) {
            $date  = Carbon::today()->subDays($i);
            $count = Progress::where('user_id', $userId)
                ->whereDate('created_at', $date)
                ->count();
            $weeks[] = ['date' => $date->format('D'), 'sessions' => $count];
        }
        return $weeks;
    }
}
