<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Progress;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherController extends Controller
{
    public function analytics(Request $request)
    {
        $students  = Student::all();
        $allProgress = Progress::all();

        $avgScore = $allProgress->count() > 0
            ? round($allProgress->avg('score'))
            : 0;

        // Subject breakdown
        $subjectPerf = $allProgress->groupBy(fn($p) => $p->lesson?->subject ?? 'Other')
            ->map(fn($g) => ['score' => round($g->avg('score')), 'count' => $g->count()])
            ->map(fn($v, $k) => ['subject' => $k, 'score' => $v['score']])
            ->values();

        // At-risk: students with avg score < 50
        $atRisk = $allProgress->groupBy('student_id')
            ->filter(fn($g) => $g->avg('score') < 50)
            ->map(fn($g, $sid) => [
                'name'    => Student::find($sid)?->user?->name ?? 'Student',
                'subject' => $g->sortBy('score')->first()?->lesson?->subject ?? '',
                'score'   => round($g->avg('score')),
            ])->values();

        return response()->json([
            'stats' => [
                'total_students'    => $students->count(),
                'avg_score'         => $avgScore,
                'lessons_published' => Lesson::count(),
                'at_risk'           => $atRisk->count(),
            ],
            'subject_performance' => $subjectPerf,
            'weekly_activity'     => $this->weeklyActivity(),
            'weak_students'       => $atRisk->take(5),
            'ai_suggestions'      => $this->generateSuggestions($subjectPerf, $atRisk),
        ]);
    }

    private function weeklyActivity(): array
    {
        return collect(range(4, 0))->map(function ($weeksAgo) {
            $start = now()->subWeeks($weeksAgo)->startOfWeek();
            $end   = $start->copy()->endOfWeek();
            $count = Progress::whereBetween('completed_at', [$start, $end])->count();
            return ['week' => 'W' . (5 - $weeksAgo), 'sessions' => $count];
        })->toArray();
    }

    private function generateSuggestions($subjects, $atRisk): array
    {
        $suggestions = [];

        $weakSubject = $subjects->sortBy('score')->first();
        if ($weakSubject) {
            $suggestions[] = "Focus on {$weakSubject['subject']} — lowest average score of {$weakSubject['score']}%.";
        }

        if ($atRisk->count() > 3) {
            $suggestions[] = "You have {$atRisk->count()} at-risk students. Consider 1-on-1 sessions.";
        }

        $suggestions[] = 'Upload more multilingual content to improve engagement for Hindi/Punjabi speakers.';

        return $suggestions;
    }
}
