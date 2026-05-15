<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Progress;
use App\Models\LearningPlan;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StudentController extends Controller
{
    public function dashboard(Request $request)
    {
        $user    = $request->user();
        $student = Student::where('user_id', $user->_id)->first();

        if (! $student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $progressRecords = Progress::where('student_id', $student->_id)->get();
        $streak          = $this->calculateStreak($student->_id);
        $points          = $progressRecords->sum('score');

        // Recent lesson progress
        $recentLessons = $progressRecords->take(5)->map(fn($p) => [
            '_id'      => (string) $p->lesson_id,
            'title'    => $p->lesson?->title ?? 'Lesson',
            'subject'  => $p->lesson?->subject ?? '',
            'progress' => min(100, intval($p->score)),
        ]);

        return response()->json([
            'streak'             => $streak,
            'points'             => $points,
            'lessons_completed'  => $progressRecords->count(),
            'quizzes_taken'      => $progressRecords->count(),
            'recent_lessons'     => $recentLessons,
            'today_tasks'        => $this->getTodayTasks($student),
        ]);
    }

    public function learningPlan(Request $request)
    {
        $user    = $request->user();
        $student = Student::where('user_id', $user->_id)->first();
        $plan    = LearningPlan::where('student_id', $student?->_id)->latest()->first();

        if (! $plan) {
            return response()->json(['message' => 'No plan generated yet. Use /api/generate-plan'], 404);
        }

        return response()->json($plan);
    }

    public function submitQuiz(Request $request)
    {
        $data = $request->validate([
            'quiz_id' => 'required|string',
            'score'   => 'required|integer|min:0|max:100',
            'answers' => 'nullable|array',
        ]);

        $user    = $request->user();
        $student = Student::where('user_id', $user->_id)->first();
        $quiz    = Quiz::find($data['quiz_id']);

        if (! $student || ! $quiz) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $progress = Progress::updateOrCreate(
            ['student_id' => $student->_id, 'lesson_id' => $quiz->lesson_id],
            [
                'score'        => $data['score'],
                'attempts'     => 1,
                'completed_at' => Carbon::now(),
            ]
        );

        // Increment attempts if exists
        if ($progress->wasRecentlyCreated === false) {
            $progress->increment('attempts');
        }

        return response()->json(['message' => 'Quiz submitted', 'progress' => $progress]);
    }

    private function calculateStreak(string $studentId): int
    {
        $records = Progress::where('student_id', $studentId)
            ->orderBy('completed_at', 'desc')
            ->get(['completed_at']);

        $streak = 0;
        $day = Carbon::today();

        foreach ($records as $r) {
            if ($r->completed_at && $r->completed_at->isSameDay($day)) {
                $streak++;
                $day->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    private function getTodayTasks(Student $student): array
    {
        $plan = LearningPlan::where('student_id', $student->_id)->latest()->first();
        $day  = now()->format('l');

        if ($plan && isset($plan->weekly_plan)) {
            $today = collect($plan->weekly_plan)->firstWhere('day', $day);
            if ($today && isset($today['tasks'])) {
                return collect($today['tasks'])->pluck('topic')->toArray();
            }
        }

        return ['Complete today\'s lesson', 'Take a practice quiz', 'Review notes'];
    }
}
