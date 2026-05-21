<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Progress;
use App\Models\LearningPlan;
use App\Models\Student;

class GenerateLearningPlanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 90;

    public function __construct(protected string $userId)
    {
    }

    public function handle(): void
    {
        $aiUrl   = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');
        $student = Student::where('user_id', $this->userId)->first();

        // Fetch recent quiz scores
        $quizScores = Progress::where('user_id', $this->userId)
            ->where('type', 'quiz')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'subject' => $p->subject ?? 'General',
                'score'   => $p->score ?? 0,
                'total'   => 100,
            ])
            ->all();

        // Get attendance rate
        $totalDays    = 30;
        $activeDays   = Progress::where('user_id', $this->userId)
            ->where('created_at', '>=', now()->subDays(30))
            ->distinct('date')
            ->count();
        $attendanceRate = min(100, round(($activeDays / $totalDays) * 100));

        try {
            $response = Http::timeout(60)->post("{$aiUrl}/ai/generate-plan", [
                'user_id'         => $this->userId,
                'quiz_scores'     => $quizScores,
                'attendance_rate' => $attendanceRate,
                'grade_level'     => $student?->grade_level ?? 8,
                'language'        => 'hi',
            ]);

            if ($response->successful()) {
                $planData = $response->json('plan', []);

                LearningPlan::updateOrCreate(
                    ['user_id' => $this->userId],
                    [
                        'user_id'      => $this->userId,
                        'plan'         => $planData,
                        'generated_at' => now()->toISOString(),
                    ]
                );

                Log::info("Learning plan generated for user {$this->userId}");
            } else {
                Log::warning("AI plan generation failed for user {$this->userId}", ['status' => $response->status()]);
            }
        } catch (\Exception $e) {
            Log::error("GenerateLearningPlanJob error for user {$this->userId}", ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
