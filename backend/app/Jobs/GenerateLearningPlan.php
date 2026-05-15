<?php

namespace App\Jobs;

use App\Models\Student;
use App\Models\LearningPlan;
use App\Services\AIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class GenerateLearningPlan implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct(public readonly string $studentId) {}

    public function handle(AIService $ai): void
    {
        $student = Student::find($this->studentId);
        if (! $student) return;

        $planData = $ai->generateLearningPlan(
            studentId:    (string) $student->_id,
            gradeLevel:   $student->grade_level ?? 'Class 6',
            language:     $student->user?->language ?? 'hi',
            progressData: $student->progress_summary ?? [],
        );

        LearningPlan::updateOrCreate(
            ['student_id' => $this->studentId],
            ['weekly_plan' => $planData['weekly_plan'] ?? [], 'generated_at' => Carbon::now()],
        );
    }
}
