<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'phone'       => 'required|string|unique:mongodb.users,phone',
            'password'    => 'required|min:6',
            'role'        => 'required|in:student,teacher,volunteer',
            'language'    => 'nullable|in:en,hi,pa',
            'grade_level' => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'phone'    => $data['phone'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
            'language' => $data['language'] ?? 'hi',
        ]);

        // Create role-specific profile
        if ($data['role'] === 'student') {
            Student::create([
                'user_id'     => $user->_id,
                'grade_level' => $data['grade_level'] ?? 'Class 6',
                'progress_summary' => [],
                'preferences' => ['language' => $data['language'] ?? 'hi'],
            ]);
        } elseif ($data['role'] === 'teacher') {
            Teacher::create(['user_id' => $user->_id, 'specialization' => '']);
        }

        $token = $user->createToken('eduko-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'phone'    => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('phone', $data['phone'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['phone' => 'Invalid credentials.']);
        }

        $token = $user->createToken('eduko-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }
}
