<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\VolunteerController;
use App\Http\Controllers\NotificationController;

// ── Public Routes ────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Authenticated Routes (Sanctum) ───────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::get('/user',     [AuthController::class, 'me']);
    Route::get('/me',       [AuthController::class, 'me']);

    // ── Student ──────────────────────────────────────────────
    Route::get('/dashboard',                         [StudentController::class, 'dashboard']);
    Route::get('/learning-plan',                     [StudentController::class, 'learningPlan']);
    Route::post('/quiz/submit',                      [StudentController::class, 'submitQuiz']);
    Route::get('/progress',                          [StudentController::class, 'progress']);
    Route::get('/lessons/{id}/download',             [StudentController::class, 'downloadLesson']);

    // ── Lessons (shared) ─────────────────────────────────────
    Route::get('/lessons',                           [LessonController::class, 'index']);
    Route::get('/lessons/offline',                   [LessonController::class, 'offline']);
    Route::get('/lessons/{id}',                      [LessonController::class, 'show']);
    Route::post('/lessons',                          [LessonController::class, 'store']);
    Route::put('/lessons/{id}',                      [LessonController::class, 'update']);
    Route::delete('/lessons/{id}',                   [LessonController::class, 'destroy']);

    // ── Teacher ──────────────────────────────────────────────
    Route::prefix('teacher')->group(function () {
        Route::get('/dashboard',                     [TeacherController::class, 'dashboard']);
        Route::get('/analytics',                     [TeacherController::class, 'analytics']);
        Route::post('/upload-lesson',                [TeacherController::class, 'uploadLesson']);
        Route::post('/send-sms',                     [TeacherController::class, 'sendSMS']);
    });

    // Legacy analytics route
    Route::get('/analytics/teacher',                 [TeacherController::class, 'analytics']);
    Route::get('/analytics/student',                 [StudentController::class, 'progress']);

    // ── AI ───────────────────────────────────────────────────
    Route::post('/ask-ai',                           [AIController::class, 'chat']);
    Route::post('/generate-plan',                    [AIController::class, 'generatePlan']);
    Route::post('/translate',                        [AIController::class, 'translate']);
    Route::post('/speech-to-text',                   [AIController::class, 'speechToText']);
    Route::post('/ocr',                              [AIController::class, 'ocr']);

    // ── Volunteer ────────────────────────────────────────────
    Route::post('/volunteer/join',                   [VolunteerController::class, 'join']);
    Route::get('/sessions',                          [VolunteerController::class, 'sessions']);
    Route::post('/session/book',                     [VolunteerController::class, 'bookSession']);
    Route::get('/volunteer/my-profile',              [VolunteerController::class, 'myProfile']);

    // ── Notifications (Twilio) ───────────────────────────────
    Route::post('/send-reminder',                    [NotificationController::class, 'sendReminder']);
    Route::post('/bulk-reminder',                    [NotificationController::class, 'bulkReminder']);
    Route::post('/exam-alert',                       [NotificationController::class, 'examAlert']);
});
