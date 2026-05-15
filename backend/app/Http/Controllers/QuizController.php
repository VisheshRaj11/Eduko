<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Lesson;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function getByLesson(string $lessonId)
    {
        $quiz = Quiz::where('lesson_id', $lessonId)->first();

        if (! $quiz) {
            return response()->json(['message' => 'No quiz for this lesson yet'], 404);
        }

        return response()->json($quiz);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lesson_id' => 'required|string',
            'title'     => 'required|string',
            'questions' => 'required|array|min:1',
        ]);

        Lesson::findOrFail($data['lesson_id']);
        $quiz = Quiz::create($data);

        return response()->json($quiz, 201);
    }
}
