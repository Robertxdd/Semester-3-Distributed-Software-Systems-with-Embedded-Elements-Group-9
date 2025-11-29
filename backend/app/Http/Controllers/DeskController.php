<?php

namespace App\Http\Controllers;

use App\Models\Desk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeskController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Desk::all());
    }

    public function store(Request $request): JsonResponse
    {
        $desk = Desk::create($this->validatedData($request, requireName: true));

        return response()->json($desk, 201);
    }

    public function show(Desk $desk): JsonResponse
    {
        return response()->json($desk);
    }

    public function update(Request $request, Desk $desk): JsonResponse
    {
        $desk->update($this->validatedData($request, requireName: false));

        return response()->json($desk);
    }

    public function destroy(Desk $desk): JsonResponse
    {
        $desk->delete();

        return response()->json(null, 204);
    }

    public function moveUp(Desk $desk): JsonResponse
    {
        $desk->update([
            'height' => $desk->max_height,
            'state'  => 'stopped',
        ]);

        return response()->json($desk);
    }

    public function moveDown(Desk $desk): JsonResponse
    {
        $desk->update([
            'height' => $desk->min_height,
            'state'  => 'stopped',
        ]);

        return response()->json($desk);
    }

    public function stop(Desk $desk): JsonResponse
    {
        $desk->update(['state' => 'stopped']);

        return response()->json($desk);
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
