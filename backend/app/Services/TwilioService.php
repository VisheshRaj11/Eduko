<?php

namespace App\Services;

use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log;

class TwilioService
{
    protected Client $twilio;
    protected string $from;

    public function __construct()
    {
        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $this->from = config('services.twilio.from', '');

        if ($sid && $token) {
            $this->twilio = new Client($sid, $token);
        }
    }

    /**
     * Send an SMS to a phone number
     */
    public function sendSMS(string $to, string $message): bool
    {
        try {
            if (!isset($this->twilio)) {
                Log::warning('Twilio not configured — SMS not sent', ['to' => $to, 'msg' => $message]);
                return false;
            }

            $to = $this->formatIndianNumber($to);

            $this->twilio->messages->create($to, [
                'from' => $this->from,
                'body' => $message,
            ]);

            Log::info('SMS sent via Twilio', ['to' => $to]);
            return true;
        } catch (\Exception $e) {
            Log::error('Twilio SMS error', ['error' => $e->getMessage(), 'to' => $to]);
            return false;
        }
    }

    /**
     * Format phone number to E.164 format with +91 for India
     */
    public function formatIndianNumber(string $phone): string
    {
        // Remove non-numeric chars except leading +
        $clean = preg_replace('/[^0-9+]/', '', $phone);

        // Already in international format
        if (str_starts_with($clean, '+')) {
            return $clean;
        }

        // 10-digit Indian mobile number
        if (strlen($clean) === 10) {
            return '+91' . $clean;
        }

        // 12-digit with 91 prefix
        if (strlen($clean) === 12 && str_starts_with($clean, '91')) {
            return '+' . $clean;
        }

        return '+91' . $clean;
    }

    /**
     * Send SMS to multiple recipients
     */
    public function sendBulkSMS(array $numbers, string $message): array
    {
        $results = [];
        foreach ($numbers as $number) {
            $results[$number] = $this->sendSMS($number, $message);
        }
        return $results;
    }
}
