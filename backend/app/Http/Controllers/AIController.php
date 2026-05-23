<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    protected string $aiUrl;

    public function __construct()
    {
        $this->aiUrl = rtrim(config('services.ai.url', env('AI_SERVICE_URL', 'http://localhost:4000')), '/');
    }

    /**
     * POST /api/ask-ai
     * Forward chat to FastAPI RAG service
     */
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message'  => 'required|string|min:1|max:4000',
            'language' => 'nullable|string|in:hi,pa,en',
            'subject'  => 'nullable|string|max:100',
            'lesson_id'=> 'nullable|string|max:100',
            'history'  => 'nullable|array',
        ]);

        try {
            $response = Http::timeout(60)->post("{$this->aiUrl}/ai/chat", [
                'message'  => $validated['message'],
                'language' => $validated['language'] ?? 'en',
                'subject'  => $validated['subject'] ?? null,
                'lesson_id'=> $validated['lesson_id'] ?? null,
                'user_id'  => (string) $request->user()->_id,
                'history'  => $validated['history'] ?? [],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                \App\Models\ChatMessage::create([
                    'user_id' => $request->user()->_id,
                    'message' => $validated['message'],
                    'response' => $data['response'] ?? '',
                    'language' => $validated['language'] ?? 'en',
                ]);

                return response()->json($data);
            }

            return response()->json(['response' => 'AI service is unavailable. Please try again.'], 503);
        } catch (\Exception $e) {
            return response()->json(['response' => 'AI service error. Please try again.'], 503);
        }
    }

    /**
     * GET /api/ask-ai/history
     * Retrieve the last 50 Q&A pairs for the user
     */
    public function getHistory(Request $request)
    {
        $messages = \App\Models\ChatMessage::where('user_id', $request->user()->_id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        return response()->json($messages);
    }

    /**
     * POST /api/generate-plan
     * Dispatch async plan generation job and return 202
     */
    public function generatePlan(Request $request)
    {
        $userId = (string) $request->user()->_id;
        \App\Jobs\GenerateLearningPlanJob::dispatch($userId);

        return response()->json([
            'status'  => 'queued',
            'message' => 'Learning plan generation started. Check /api/learning-plan in a moment.',
        ], 202);
    }

    /**
     * POST /api/translate
     */
    public function translate(Request $request)
    {
        $validated = $request->validate([
            'text'            => 'required|string|min:1|max:10000',
            'target_language' => 'required|string|in:hi,pa,en',
            'grade_level'     => 'nullable|integer|min:1|max:12',
            'simplify'        => 'nullable|boolean',
        ]);

        try {
            $response = Http::timeout(30)->post("{$this->aiUrl}/ai/translate", $validated);
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Translation service unavailable.'], 503);
        }
    }

    /**
     * POST /api/speech-to-text
     * Forward audio file to FastAPI
     */
    public function speechToText(Request $request)
    {
        $request->validate(['audio' => 'required|file|mimes:wav,mp3,webm,ogg,m4a,mp4|max:20480']);

        try {
            $file     = $request->file('audio');
            $mime     = $file->getClientMimeType();
            if (empty($mime) || $mime === 'application/octet-stream') {
                $mime = 'audio/webm'; // Fallback
            }

            $response = Http::timeout(60)
                ->attach('audio', file_get_contents($file->getRealPath()), $file->getClientOriginalName(), ['Content-Type' => $mime])
                ->post("{$this->aiUrl}/ai/speech-to-text");

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Speech-to-text service unavailable.'], 503);
        }
    }

    /**
     * POST /api/ocr
     * Forward image file to FastAPI
     */
    public function ocr(Request $request)
    {
        $request->validate(['image' => 'required|image|max:10240']);

        try {
            $file     = $request->file('image');
            $response = Http::timeout(60)
                ->attach('image', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                ->post("{$this->aiUrl}/ai/ocr");

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => 'OCR service unavailable.'], 503);
        }
    }
}
