<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Volunteer;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|min:2|max:100',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:8',
            'role'        => 'required|in:student,teacher,volunteer',
            'grade_level' => 'nullable|integer|min:1|max:12',
            'phone'       => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
            'phone'    => $validated['phone'] ?? null,
        ]);

        // Create role-specific profile document
        match ($validated['role']) {
            'student' => Student::create([
                'user_id'     => (string) $user->_id,
                'name'        => $user->name,
                'email'       => $user->email,
                'grade_level' => $validated['grade_level'] ?? 8,
                'streak'      => 0,
                'points'      => 0,
                'badges'      => [],
                'subjects'    => [],
            ]),
            'teacher' => Teacher::create([
                'user_id' => (string) $user->_id,
                'name'    => $user->name,
                'email'   => $user->email,
                'subjects'=> [],
            ]),
            'volunteer' => Volunteer::create([
                'user_id'  => (string) $user->_id,
                'name'     => $user->name,
                'email'    => $user->email,
                'subjects' => [],
                'bio'      => '',
                'verified' => false,
            ]),
        };

        $token = $user->createToken('eduko-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => array_merge($user->toArray(), ['role' => $validated['role']]),
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Revoke old tokens
        $user->tokens()->delete();
        $token = $user->createToken('eduko-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user->toArray(),
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user();

        // Fetch role-specific profile
        $profile = match ($user->role) {
            'student'   => Student::where('user_id', (string) $user->_id)->first(),
            'teacher'   => Teacher::where('user_id', (string) $user->_id)->first(),
            'volunteer' => Volunteer::where('user_id', (string) $user->_id)->first(),
            default     => null,
        };

        return response()->json([
            'user'    => $user->toArray(),
            'profile' => $profile?->toArray(),
        ]);
    }
}
