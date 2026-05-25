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

        // Calculate Average Score across all quizzes
        $avgScore = Progress::where('user_id', $userId)
            ->whereIn('type', ['quiz', 'ai_quiz'])
            ->avg('score') ?? 0;

        // Lessons visited (duration / visited documents)
        $lessonsCompleted = Progress::where('user_id', $userId)
            ->where('type', 'lesson')
            ->distinct('lesson_id')
            ->count('lesson_id');

        // Quizzes taken (both standard and AI)
        $quizzesTaken = Progress::where('user_id', $userId)
            ->whereIn('type', ['quiz', 'ai_quiz'])
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

        // AI Quiz Performance
        $aiPerformance = Progress::where('user_id', $userId)
            ->where('type', 'ai_quiz')
            ->whereNotNull('subject')
            ->get()
            ->groupBy('subject')
            ->map(function ($items, $subject) {
                $avgScore = round($items->avg('score'));
                // Determine level based on average score
                if ($avgScore >= 75) $level = 'Good';
                elseif ($avgScore >= 50) $level = 'Avg';
                else $level = 'Weak';
                
                return [
                    'subject' => $subject,
                    'percentage' => $avgScore,
                    'level' => $level,
                ];
            })->values()->all();

        return response()->json([
            'avg_score'          => round($avgScore),
            'lessons_completed'  => $lessonsCompleted,
            'quizzes_taken'      => $quizzesTaken,
            'recent_lessons'     => $recentLessons,
            'today_tasks'        => $todayTasks,
            'badges'             => $student?->badges ?? [],
            'weekly_progress'    => $this->getWeeklyProgress($userId),
            'ai_performance'     => $aiPerformance,
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

    public function getAssignedTasks(Request $request)
    {
        $userId = (string) $request->user()->_id;
        $tasks = \App\Models\AssignedTask::with('teacher')
            ->where('student_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($tasks);
    }

    public function completeTask(Request $request, $id)
    {
        $userId = (string) $request->user()->_id;
        $task = \App\Models\AssignedTask::where('_id', $id)
            ->where('student_id', $userId)
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        $task->is_completed = true;
        $task->completed_at = now();
        $task->save();

        return response()->json(['message' => 'Task completed successfully', 'task' => $task]);
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

    /**
     * POST /api/lessons/{id}/view
     */
    public function viewLesson(Request $request, $id)
    {
        $userId = (string) $request->user()->_id;
        
        // Find existing or create progress
        $progress = Progress::firstOrCreate([
            'user_id' => $userId,
            'lesson_id' => $id,
            'type' => 'lesson'
        ], [
            'completed' => false,
            'completion_pct' => 0,
        ]);
        
        // Mark as completed
        $progress->completed = true;
        $progress->completion_pct = 100;
        $progress->save();
        
        return response()->json(['success' => true]);
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
