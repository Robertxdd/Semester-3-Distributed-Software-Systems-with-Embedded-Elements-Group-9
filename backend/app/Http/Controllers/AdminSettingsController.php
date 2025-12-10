<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminSettingsController extends Controller
{
    private const FILE = 'admin_settings.json';

    public function index(Request $request): JsonResponse
    {
        $this->requireRole($request->user(), ['ADMIN']);

        $data = $this->loadSettings();

        return response()->json($data);
    }

    public function update(Request $request): JsonResponse
    {
        $this->requireRole($request->user(), ['ADMIN']);

        $validated = $request->validate([
            'connection_settings' => ['sometimes', 'array'],
            'energy_settings' => ['sometimes', 'array'],
            'data_settings' => ['sometimes', 'array'],
        ]);

        $current = $this->loadSettings();
        $merged = array_merge($current, $validated);

        Storage::disk('local')->put(self::FILE, json_encode($merged));

        return response()->json($merged);
    }

    private function loadSettings(): array
    {
        if (!Storage::disk('local')->exists(self::FILE)) {
            return [
                'connection_settings' => [],
                'energy_settings' => [],
                'data_settings' => [],
            ];
        }

        $json = Storage::disk('local')->get(self::FILE);
        $data = json_decode($json, true);

        return is_array($data) ? $data : [
            'connection_settings' => [],
            'energy_settings' => [],
            'data_settings' => [],
        ];
    }
}
