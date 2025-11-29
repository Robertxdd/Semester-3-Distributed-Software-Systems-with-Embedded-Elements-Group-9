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
        $data = $this->validatedData($request);

        $desk = Desk::create($data);

        return response()->json($desk, 201);
    }

    public function show(Desk $desk): JsonResponse
    {
        return response()->json($desk);
    }

    public function update(Request $request, Desk $desk): JsonResponse
    {
        $desk->update($this->validatedData($request));

        return response()->json($desk);
    }

    public function destroy(Desk $desk): JsonResponse
    {
        $desk->delete();

        return response()->json(null, 204);
    }

    public function moveUp(Desk $desk): JsonResponse
    {
        $desk->update(['state' => 'moving_up']);

        return response()->json(['message' => 'Desk moving up']);
    }

    public function moveDown(Desk $desk): JsonResponse
    {
        $desk->update(['state' => 'moving_down']);

        return response()->json(['message' => 'Desk moving down']);
    }

    public function stop(Desk $desk): JsonResponse
    {
        $desk->update(['state' => 'stopped']);

        return response()->json(['message' => 'Desk stopped']);
    }

    protected function validatedData(Request $request): array
    {
        return $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'external_id' => ['nullable', 'string', 'max:255'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'height' => ['nullable', 'integer'],
            'min_height' => ['nullable', 'integer'],
            'max_height' => ['nullable', 'integer'],
            'state' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
