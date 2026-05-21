<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TwilioService;
use App\Models\Student;

class NotificationController extends Controller
{
    protected TwilioService $twilio;

    public function __construct(TwilioService $twilio)
    {
        $this->twilio = $twilio;
    }

    /**
     * POST /api/send-reminder
     * Send custom reminder to a specific user
     */
    public function sendReminder(Request $request)
    {
        $validated = $request->validate([
            'phone'   => 'required|string',
            'message' => 'required|string|min:5|max:320',
        ]);

        $sent = $this->twilio->sendSMS($validated['phone'], $validated['message']);

        return response()->json([
            'sent'    => $sent,
            'message' => $sent ? 'SMS reminder sent.' : 'SMS failed to send.',
        ]);
    }

    /**
     * POST /api/bulk-reminder
     * Send reminder to all students (or by grade)
     */
    public function bulkReminder(Request $request)
    {
        $validated = $request->validate([
            'message'     => 'required|string|min:5|max:320',
            'grade_level' => 'nullable|integer|min:1|max:12',
        ]);

        $query = Student::whereNotNull('phone');
        if (isset($validated['grade_level'])) {
            $query->where('grade_level', $validated['grade_level']);
        }

        $phones  = $query->pluck('phone')->filter()->values()->all();
        $results = $this->twilio->sendBulkSMS($phones, $validated['message']);
        $sent    = count(array_filter($results));

        return response()->json([
            'message' => "Reminder sent to {$sent} of " . count($phones) . " students.",
            'sent'    => $sent,
            'total'   => count($phones),
        ]);
    }

    /**
     * POST /api/exam-alert
     * Send exam/quiz alert with subject and date
     */
    public function examAlert(Request $request)
    {
        $validated = $request->validate([
            'subject'     => 'required|string',
            'date'        => 'required|string',
            'time'        => 'nullable|string',
            'grade_level' => 'nullable|integer',
        ]);

        $time = $validated['time'] ? " at {$validated['time']}" : '';
        $sms  = "📝 Eduko Exam Alert: {$validated['subject']} quiz is scheduled on {$validated['date']}{$time}. Please revise and be prepared! Good luck! 🌟";

        $query = Student::whereNotNull('phone');
        if (isset($validated['grade_level'])) {
            $query->where('grade_level', $validated['grade_level']);
        }

        $phones  = $query->pluck('phone')->filter()->values()->all();
        $results = $this->twilio->sendBulkSMS($phones, $sms);
        $sent    = count(array_filter($results));

        return response()->json([
            'message' => "Exam alert sent to {$sent} students.",
            'sent'    => $sent,
        ]);
    }
}
