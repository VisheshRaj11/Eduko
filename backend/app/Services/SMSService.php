<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SMSService
{
    // Fast2SMS — free tier for India
    // https://www.fast2sms.com/
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = env('FAST2SMS_API_KEY', '');
    }

    /**
     * Send a transactional SMS via Fast2SMS (free tier).
     */
    public function send(string $phone, string $message): bool
    {
        if (empty($this->apiKey)) {
            Log::info("SMS (no key set): [{$phone}] {$message}");
            return true; // Log-only in dev
        }

        try {
            $response = Http::withHeaders([
                'authorization' => $this->apiKey,
                'Content-Type'  => 'application/json',
            ])->post('https://www.fast2sms.com/dev/bulkV2', [
                'route'   => 'q',           // Quick SMS (free)
                'message' => $message,
                'numbers' => $phone,
            ]);

            if ($response->json('return') === true) {
                return true;
            }

            Log::warning('Fast2SMS failed', ['body' => $response->body()]);
            return false;
        } catch (\Exception $e) {
            Log::error('SMS send error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function sendExamReminder(string $phone, string $examName, string $date): bool
    {
        return $this->send($phone, "Eduko Reminder: Your exam '{$examName}' is on {$date}. Good luck! 📚");
    }

    public function sendHomeworkAlert(string $phone, string $subject): bool
    {
        return $this->send($phone, "Eduko: New homework assigned in {$subject}. Login to complete it. 🎓");
    }
}
