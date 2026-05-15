<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessAIChat;
use App\Jobs\GenerateLearningPlan;
use App\Models\Student;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AIController extends Controller
{
    public function __construct(private AIService $ai) {}

    // POST /api/ask-ai
    public function chat(Request $request)
    {
        $data = $request->validate([
            'message'  => 'required|string|max:2000',
            'language' => 'nullable|in:en,hi,pa',
            'history'  => 'nullable|array',
        ]);

        $user = $request->user();

        // Dispatch to Redis queue; return job ID immediately for polling
        // For simple usage, call AI service directly (sync) with 30s timeout
        try {
            $result = $this->ai->chat(
                message:  $data['message'],
                language: $data['language'] ?? $user->language ?? 'hi',
                userId:   (string) $user->_id,
                history:  $data['history'] ?? [],
            );

            return response()->json(['response' => $result]);
        } catch (\Exception $e) {
            // Queue for async if AI service is slow
            $jobId = uniqid('chat_', true);
            ProcessAIChat::dispatch($user->_id, $data)->onQueue('ai');
            return response()->json(['job_id' => $jobId, 'status' => 'queued'], 202);
        }
    }

    // POST /api/generate-plan
    public function generatePlan(Request $request)
    {
        $user    = $request->user();
        $student = Student::where('user_id', $user->_id)->first();

        if (! $student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        try {
            $plan = $this->ai->generateLearningPlan(
                studentId:   (string) $student->_id,
                gradeLevel:  $student->grade_level ?? 'Class 6',
                language:    $user->language ?? 'hi',
                progressData: $student->progress_summary ?? [],
            );

            return response()->json($plan);
        } catch (\Exception $e) {
            GenerateLearningPlan::dispatch($student->_id)->onQueue('ai');
            return response()->json(['status' => 'generating', 'message' => 'Plan is being generated.'], 202);
        }
    }

    // POST /api/translate
    public function translate(Request $request)
    {
        $data = $request->validate([
            'text'     => 'required|string',
            'target'   => 'required|in:en,hi,pa',
        ]);

        $result = $this->ai->translate($data['text'], $data['target']);

        return response()->json(['translated' => $result]);
    }

    // POST /api/speech-to-text
    public function speechToText(Request $request)
    {
        $request->validate(['audio' => 'required|file|mimes:webm,mp3,wav,ogg|max:10240']);

        $path   = $request->file('audio')->store('temp_audio');
        $result = $this->ai->speechToText(storage_path('app/' . $path));

        return response()->json(['text' => $result]);
    }

    // POST /api/ocr
    public function ocr(Request $request)
    {
        $request->validate(['image' => 'required|image|max:5120']);

        $path   = $request->file('image')->store('temp_images');
        $result = $this->ai->ocr(storage_path('app/' . $path));

        return response()->json(['text' => $result]);
    }
}
