<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class DeskSimulatorClient
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('linak.base_url'), '/');
        $this->apiKey  = config('linak.api_key');

        if (empty($this->apiKey)) {
            throw new RuntimeException('LINAK_SIMULATOR_API_KEY is not configured.');
        }
    }

    protected function buildUrl(string $path): string
    {
        // Resultado: http://localhost:8000/api/v2/<API_KEY>/desks...
        return "{$this->baseUrl}/{$this->apiKey}/" . ltrim($path, '/');
    }

    public function getDesks(): array
    {
        $response = Http::get($this->buildUrl('desks'));

        $response->throw();

        return $response->json() ?? [];
    }

    public function getDesk(string $deskId): array
    {
        $response = Http::get($this->buildUrl("desks/{$deskId}"));

        $response->throw();

        return $response->json() ?? [];
    }
}
