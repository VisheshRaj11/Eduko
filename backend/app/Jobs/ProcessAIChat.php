<?php

namespace App\Jobs;

use App\Models\ChatMessage;
use App\Services\AIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAIChat implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(
        public readonly string $userId,
        public readonly array  $data,
    ) {}

    public function handle(AIService $ai): void
    {
        try {
            $response = $ai->chat(
                message:  $this->data['message'],
                language: $this->data['language'] ?? 'hi',
                userId:   $this->userId,
                history:  $this->data['history'] ?? [],
            );

            ChatMessage::create([
                'user_id'  => $this->userId,
                'message'  => $this->data['message'],
                'response' => $response,
                'language' => $this->data['language'] ?? 'hi',
            ]);
        } catch (\Exception $e) {
            Log::error('ProcessAIChat failed', ['error' => $e->getMessage()]);
            $this->fail($e);
        }
    }
}
