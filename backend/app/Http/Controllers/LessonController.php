<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function index(Request $request)
    {
        $query = Lesson::query();

        if ($request->filled('subject'))    $query->bySubject($request->subject);
        if ($request->filled('language'))   $query->byLanguage($request->language);
        if ($request->filled('difficulty')) $query->byDifficulty($request->difficulty);
        if ($request->filled('search'))     $query->where('title', 'like', '%' . $request->search . '%');

        $lessons = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($lessons);
    }

    public function show(string $id)
    {
        $lesson = Lesson::findOrFail($id);
        return response()->json($lesson);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'          => 'required|string|max:200',
            'subject'        => 'required|string',
            'language'       => 'required|in:en,hi,pa',
            'difficulty'     => 'required|in:Easy,Medium,Hard',
            'content_blocks' => 'nullable|array',
            'resources'      => 'nullable|array',
        ]);

        $lesson = Lesson::create([
            ...$data,
            'created_by'     => $request->user()->_id,
            'content_blocks' => $data['content_blocks'] ?? [],
            'resources'      => $data['resources'] ?? [],
        ]);

        return response()->json($lesson, 201);
    }

    public function update(Request $request, string $id)
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->update($request->only(['title','subject','language','difficulty','content_blocks','resources']));
        return response()->json($lesson);
    }

    public function destroy(string $id)
    {
        Lesson::findOrFail($id)->delete();
        return response()->json(['message' => 'Lesson deleted']);
    }
}
