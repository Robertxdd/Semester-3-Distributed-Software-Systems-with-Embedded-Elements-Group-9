<?php

namespace App\Http\Controllers;

use App\Models\StandReminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class StandReminderController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'interval_minutes' => 'required|integer|min:1|max:240',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
        ]);

        StandReminder::where('user_id', Auth::id())->delete();

        $reminder = StandReminder::create([
            'user_id' => Auth::id(),
            'interval_minutes' => $validated['interval_minutes'],
            'start_time' => $validated['start_time'] ?? '09:00',
            'end_time' => $validated['end_time'] ?? '17:00',
            'is_active' => true,
        ]);

        return response()->json($reminder, 201);
    }

    public function show()
    {
        $reminder = StandReminder::where('user_id', Auth::id())->first();
        
        if (!$reminder) {
            return response()->json(['message' => 'No reminder set'], 404);
        }

        return response()->json($reminder);
    }

    public function update(Request $request)
    {
        $reminder = StandReminder::where('user_id', Auth::id())->firstOrFail();

        $validated = $request->validate([
            'interval_minutes' => 'sometimes|integer|min:15|max:240',
            'is_active' => 'sometimes|boolean',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
        ]);

        $reminder->update($validated);

        return response()->json($reminder);
    }

    public function destroy()
    {
        $deleted = StandReminder::where('user_id', Auth::id())->delete();
        
        return response()->json(['message' => 'Reminder deleted', 'deleted' => $deleted > 0]);
    }

    public function checkReminder()
    {
        $reminder = StandReminder::where('user_id', Auth::id())
            ->where('is_active', true)
            ->first();

        if (!$reminder) {
            return response()->json([
                'should_remind' => false,
                'message' => 'No active reminder set'
            ]);
        }

        $now = Carbon::now();
        $currentTime = $now->format('H:i');
        
        if ($currentTime < $reminder->start_time || $currentTime > $reminder->end_time) {
            return response()->json([
                'should_remind' => false,
                'message' => 'Outside active hours'
            ]);
        }

        if ($reminder->last_reminded_at) {
            $minutesSinceLastReminder = $now->diffInMinutes(Carbon::parse($reminder->last_reminded_at));
            
            if ($minutesSinceLastReminder < $reminder->interval_minutes) {
                return response()->json([
                    'should_remind' => false,
                    'message' => 'Not time yet',
                    'next_reminder_in_minutes' => $reminder->interval_minutes - $minutesSinceLastReminder
                ]);
            }
        }

        $reminder->update(['last_reminded_at' => $now]);

        return response()->json([
            'should_remind' => true,
            'message' => "Time to stand up! You've been sitting for {$reminder->interval_minutes} minutes.",
            'next_reminder_in_minutes' => $reminder->interval_minutes
        ]);
    }
}