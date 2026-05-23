<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Progress;
use App\Models\Student;

class AIQuizController extends Controller
{
    protected string $aiUrl;

    public function __construct()
    {
        $this->aiUrl = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'subject'    => 'required|string|max:100',
            'count'      => 'required|integer|min:1|max:20',
            'type'       => 'required|string|in:mcq,subjective',
            'difficulty' => 'required|string|in:easy,medium,hard',
            'prompt'     => 'nullable|string|max:500',
        ]);

        try {
            $response = Http::timeout(60)->post("{$this->aiUrl}/ai/quiz/generate", $validated);
            
            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to generate quiz from AI service.'], 502);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI service unavailable.'], 503);
        }
    }

    public function evaluate(Request $request)
    {
        $validated = $request->validate([
            'subject'  => 'required|string|max:100',
            'type'     => 'required|string|in:mcq,subjective',
            'qa_pairs' => 'required|array|min:1',
        ]);

        $userId = (string) $request->user()->_id;

        try {
            $response = Http::timeout(60)->post("{$this->aiUrl}/ai/quiz/evaluate", $validated);
            
            if ($response->successful()) {
                $evalData = $response->json();
                
                // Ensure default values if AI fails to return proper schema
                $score = $evalData['score'] ?? 0;
                $rating = $evalData['rating'] ?? 'avg';
                $feedback = $evalData['feedback'] ?? '';
                
                // Save to Progress
                Progress::create([
                    'user_id'        => $userId,
                    'type'           => 'ai_quiz',
                    'subject'        => $validated['subject'],
                    'score'          => $score,
                    'ai_rating'      => $rating,
                    'feedback'       => $feedback,
                    'answers'        => $validated['qa_pairs'],
                    'completed'      => true,
                    'completed_at'   => now(),
                ]);

                // Update student points if score > 0
                if ($score > 0) {
                    $pointsEarned = (int)($score / 10);
                    $student = Student::where('user_id', $userId)->first();
                    if ($student) {
                        $student->points = ($student->points ?? 0) + $pointsEarned;
                        $student->save();
                    }
                }

                return response()->json($evalData);
            }

            return response()->json(['error' => 'Failed to evaluate quiz from AI service.'], 502);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI service unavailable.'], 503);
        }
    }
}
