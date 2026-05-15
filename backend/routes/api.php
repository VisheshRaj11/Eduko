<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\VolunteerController;

// ── Public ─────────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Authenticated ──────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn(Request $r) => response()->json($r->user()));

    // Student
    Route::get('/dashboard',     [StudentController::class, 'dashboard']);
    Route::get('/learning-plan', [StudentController::class, 'learningPlan']);
    Route::post('/quiz/submit',  [StudentController::class, 'submitQuiz']);

    // AI
    Route::post('/ask-ai',       [AIController::class, 'chat']);
    Route::post('/generate-plan',[AIController::class, 'generatePlan']);
    Route::post('/translate',    [AIController::class, 'translate']);
    Route::post('/speech-to-text',[AIController::class, 'speechToText']);
    Route::post('/ocr',          [AIController::class, 'ocr']);

    // Lessons (read: all | write: teacher)
    Route::get('/lessons',            [LessonController::class, 'index']);
    Route::get('/lessons/{id}',       [LessonController::class, 'show']);
    Route::post('/lessons',           [LessonController::class, 'store']);
    Route::put('/lessons/{id}',       [LessonController::class, 'update']);
    Route::delete('/lessons/{id}',    [LessonController::class, 'destroy']);

    // Quizzes
    Route::get('/quizzes/{lessonId}', [QuizController::class, 'getByLesson']);
    Route::post('/quizzes',           [QuizController::class, 'store']);

    // Analytics
    Route::get('/analytics/teacher',  [TeacherController::class, 'analytics']);

    // Volunteer & Sessions
    Route::post('/volunteer/join',    [VolunteerController::class, 'join']);
    Route::get('/sessions',           [VolunteerController::class, 'sessions']);
    Route::post('/session/book',      [VolunteerController::class, 'bookSession']);
});
