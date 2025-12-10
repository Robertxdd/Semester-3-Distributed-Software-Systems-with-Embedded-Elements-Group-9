<?php

namespace App\Http\Controllers;

use App\Models\Desk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Any authenticated user can view desks
        return response()->json(Desk::all());
    }

    public function store(Request $request): JsonResponse
    {
        // Only admins can create desks
        $this->requireRole($request->user(), ['ADMIN']);
        
        $desk = Desk::create($this->validatedData($request, requireName: true));
        
        // Log the action
        \Log::info('Desk created', ['user_id' => $request->user()->id, 'desk_id' => $desk->id]);

        return response()->json($desk, 201);
    }

    public function show(Request $request, Desk $desk): JsonResponse
    {
        // Any authenticated user can view a desk
        return response()->json($desk);
    }

    public function update(Request $request, Desk $desk): JsonResponse
    {
        // Allow occupants to update live height/state; admins keep full config control.
        $this->requireRole($request->user(), ['ADMIN', 'OCCUPANT']);
        
        $desk->update($this->validatedData($request, requireName: false));
        
        \Log::info('Desk updated', ['user_id' => $request->user()->id, 'desk_id' => $desk->id]);

        return response()->json($desk);
    }

    public function destroy(Request $request, Desk $desk): JsonResponse
    {
        // Only admins can delete desks
        $this->requireRole($request->user(), ['ADMIN']);
        
        \Log::warning('Desk deleted', ['user_id' => $request->user()->id, 'desk_id' => $desk->id]);
        
        $desk->delete();

        return response()->json(null, 204);
    }

    public function moveUp(Request $request, Desk $desk): JsonResponse
    {
        // Both admin and regular users (occupants) can control their desks
        $this->requireRole($request->user(), ['ADMIN', 'OCCUPANT']);
        
        $desk->update([
            'height' => $desk->max_height,
            'state'  => 'stopped',
        ]);
        
        \Log::info('Desk moved up', ['user_id' => $request->user()->id, 'desk_id' => $desk->id]);

        return response()->json($desk);
    }

    public function moveDown(Request $request, Desk $desk): JsonResponse
    {
        // Both admin and regular users (occupants) can control their desks
        $this->requireRole($request->user(), ['ADMIN', 'OCCUPANT']);
        
        $desk->update([
            'height' => $desk->min_height,
            'state'  => 'stopped',
        ]);
        
        \Log::info('Desk moved down', ['user_id' => $request->user()->id, 'desk_id' => $desk->id]);

        return response()->json($desk);
    }

    public function stop(Request $request, Desk $desk): JsonResponse
    {
        // Both admin and regular users can stop desks
        $this->requireRole($request->user(), ['ADMIN', 'OCCUPANT']);
        
        $desk->update(['state' => 'stopped']);
        
        \Log::info('Desk stopped', ['user_id' => $request->user()->id, 'desk_id' => $desk->id]);

        return response()->json($desk);
    }

    public function syncAll(Request $request): JsonResponse
    {
        // Admin-only: set all desks to the same height (clamped per desk limits).
        $this->requireRole($request->user(), ['ADMIN']);

        $data = $request->validate([
            'height' => ['required', 'integer', 'min:40', 'max:200'],
        ]);

        $target = $data['height'];
        $desks = Desk::all();
        $results = [];

        foreach ($desks as $desk) {
            $min = $desk->min_height ?? 60;
            $max = $desk->max_height ?? 130;
            $applied = max($min, min($target, $max));

            $desk->update([
                'height' => $applied,
                'state' => 'stopped',
            ]);

            $results[] = [
                'desk_id' => $desk->id,
                'applied_height' => $applied,
                'min_height' => $min,
                'max_height' => $max,
            ];
        }

        \Log::info('All desks synchronized', ['user_id' => $request->user()->id, 'target' => $target]);

        return response()->json([
            'requested_height' => $target,
            'desks_updated' => count($results),
            'results' => $results,
        ]);
    }

    protected function validatedData(Request $request, bool $requireName = false): array
    {
        $rules = [
            'name' => $requireName ? ['required', 'string', 'max:255'] : ['sometimes', 'string', 'max:255'],
            'external_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'manufacturer' => ['sometimes', 'nullable', 'string', 'max:255'],
            'height' => ['sometimes', 'nullable', 'integer'],
            'min_height' => ['sometimes', 'nullable', 'integer'],
            'max_height' => ['sometimes', 'nullable', 'integer'],
            'state' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];

        return $request->validate($rules);
    }
}
