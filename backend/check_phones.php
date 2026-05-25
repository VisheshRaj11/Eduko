<?php
$students = \App\Models\Student::with('user')->get();
echo "Total students: " . $students->count() . "\n";
foreach ($students as $s) {
    echo "Student: {$s->name}\n";
    echo "Has User Relation: " . ($s->user ? 'Yes' : 'No') . "\n";
    if ($s->user) {
        echo "User Phone: " . ($s->user->phone ?? 'NULL') . "\n";
    }
}
