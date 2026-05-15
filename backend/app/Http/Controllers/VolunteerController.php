<?php

namespace App\Http\Controllers;

use App\Models\Volunteer;
use App\Models\Session;
use Illuminate\Http\Request;

class VolunteerController extends Controller
{
    public function join(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string',
            'phone'          => 'required|string',
            'specialization' => 'required|string',
            'availability'   => 'nullable|string',
        ]);

        $volunteer = Volunteer::create([
            ...$data,
            'user_id' => $request->user()?->_id,
        ]);

        return response()->json($volunteer, 201);
    }

    public function sessions()
    {
        $sessions = Session::with(['volunteer'])->orderBy('scheduled_time')->get();
        return response()->json($sessions);
    }

    public function bookSession(Request $request)
    {
        $data = $request->validate([
            'volunteer_id'   => 'required|string',
            'preferred_time' => 'required|date',
            'subject'        => 'required|string',
        ]);

        $session = Session::create([
            'volunteer_id'   => $data['volunteer_id'],
            'student_id'     => $request->user()->_id,
            'scheduled_time' => $data['preferred_time'],
            'subject'        => $data['subject'],
            'status'         => 'scheduled',
        ]);

        return response()->json($session, 201);
    }
}
