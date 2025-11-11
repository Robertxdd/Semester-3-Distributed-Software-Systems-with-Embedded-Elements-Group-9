<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DeskController extends Controller
{
    private $baseUrl;

    public function __construct()
    {
        $this->baseUrl = env('SIMULATOR_URL');
    }

    public function getAll()
    {
        $response = Http::get("{$this->baseUrl}/desks");
        return $response->json();
    }

    public function getOne($id)
    {
        $response = Http::get("{$this->baseUrl}/desks/{$id}");
        return $response->json();
    }

    public function updateState(Request $request, $id)
    {
        $response = Http::put("{$this->baseUrl}/desks/{$id}/state", $request->all());
        return $response->json();
    }
}
