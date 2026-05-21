<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Volunteer;
use App\Models\Session;
use App\Models\User;
use App\Services\TwilioService;

class VolunteerController extends Controller
{
    protected TwilioService $twilio;

    public function __construct(TwilioService $twilio)
    {
        $this->twilio = $twilio;
    }

    /**
     * POST /api/volunteer/join
     */
    public function join(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'nullable|string|max:100',
            'email'        => 'nullable|email',
            'phone'        => 'nullable|string|max:20',
            'subjects'     => 'required|array|min:1',
            'subjects.*'   => 'string',
            'bio'          => 'nullable|string|max:500',
            'availability' => 'nullable|array',
        ]);

        $user = $request->user();

        $volunteer = Volunteer::updateOrCreate(
            ['user_id' => (string) $user->_id],
            [
                'name'         => $validated['name']         ?? $user->name,
                'email'        => $validated['email']        ?? $user->email,
                'phone'        => $validated['phone']        ?? $user->phone,
                'subjects'     => $validated['subjects'],
                'bio'          => $validated['bio']          ?? '',
                'availability' => $validated['availability'] ?? [],
                'verified'     => false,
                'sessions'     => 0,
                'rating'       => 0.0,
            ]
        );

        // Send SMS confirmation
        if ($volunteer->phone) {
            $this->twilio->sendSMS(
                $volunteer->phone,
                "Welcome to Eduko Volunteers, {$volunteer->name}! Your registration is under review. We'll SMS you once approved. Thank you for giving back! 🎓"
            );
        }

        return response()->json([
            'volunteer' => $volunteer->toArray(),
            'message'   => 'Thank you for registering! We will review your application and contact you within 24 hours.',
        ], 201);
    }

    /**
     * GET /api/sessions
     */
    public function sessions(Request $request)
    {
        $sessions = Session::where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->limit(20)
            ->get()
            ->map(function($session) {
                $volunteer = Volunteer::where('user_id', $session->volunteer_id)->first();
                return array_merge($session->toArray(), [
                    'volunteer' => [
                        'name'     => $volunteer?->name ?? 'Volunteer',
                        'rating'   => $volunteer?->rating ?? 4.5,
                        'sessions' => $volunteer?->sessions ?? 0,
                        'avatar'   => '👨‍🏫',
                    ],
                ]);
            });

        return response()->json($sessions);
    }

    /**
     * POST /api/session/book
     */
    public function bookSession(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string',
        ]);

        $session = Session::find($validated['session_id']);

        if (!$session) {
            return response()->json(['error' => 'Session not found.'], 404);
        }

        if (($session->booked ?? 0) >= ($session->slots ?? 10)) {
            return response()->json(['error' => 'Session is full.'], 422);
        }

        $session->booked = ($session->booked ?? 0) + 1;
        $session->save();

        $user = $request->user();

        // Send SMS confirmation to student
        if ($user->phone) {
            $this->twilio->sendSMS(
                $user->phone,
                "✅ Session Booked! \"{$session->title}\" on {$session->date} at {$session->time}. Login to Eduko for the meeting link. Happy Learning! 🎓"
            );
        }

        // Notify volunteer
        $volunteer = Volunteer::where('user_id', $session->volunteer_id)->first();
        if ($volunteer?->phone) {
            $this->twilio->sendSMS(
                $volunteer->phone,
                "📅 New student booked your session \"{$session->title}\" on {$session->date}. Slots: {$session->booked}/{$session->slots}. - Eduko"
            );
        }

        return response()->json([
            'message' => 'Session booked! SMS confirmation sent.',
            'session' => $session->toArray(),
        ]);
    }

    /**
     * GET /api/volunteer/my-profile
     */
    public function myProfile(Request $request)
    {
        $volunteer = Volunteer::where('user_id', (string) $request->user()->_id)->first();

        if (!$volunteer) {
            return response()->json(['error' => 'Volunteer profile not found.'], 404);
        }

        return response()->json($volunteer->toArray());
    }
}
