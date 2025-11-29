<?php

namespace App\Services;

use App\Models\Desk;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class DeskDataCollector
{
    public function __construct(
        protected DeskSimulatorClient $client,
        protected DeskDataHandler $handler,
    ) {
    }

    /**
     * Lanza una recogida completa:
     * - Descubre escritorios
     * - Lee config/state/usage/errors
     * - Guarda en la base de datos
     */
    public function collect(): array
    {
        $deskIds = $this->client->getDesks();

        $now = Carbon::now();

        $summary = [
            'desks_seen' => count($deskIds),
            'state_rows_inserted' => 0,
            'usage_rows_inserted' => 0,
            'error_rows_inserted' => 0,
        ];

        foreach ($deskIds as $deskId) {
            try {
                $deskData = $this->client->getDesk($deskId);

                $config     = $deskData['config']     ?? [];
                $state      = $deskData['state']      ?? [];
                $usage      = $deskData['usage']      ?? [];
                $lastErrors = $deskData['lastErrors'] ?? [];

                // 1) Upsert de la mesa en nuestra tabla "desks"
                $desk = Desk::updateOrCreate(
                    ['external_id' => $deskId],
                    [
                        'name'         => $config['name'] ?? $deskId,
                        'manufacturer' => $config['manufacturer'] ?? null,
                    ]
                );

                // 2) Guardar el estado (state)
                if (!empty($state)) {
                    $this->handler->saveStateReading($desk, $state, $now);
                    $summary['state_rows_inserted']++;
                }

                // 3) Guardar uso (usage)
                if (!empty($usage)) {
                    $this->handler->saveUsageSnapshot($desk, $usage, $now);
                    $summary['usage_rows_inserted']++;
                }

                // 4) Guardar errores (lastErrors)
                $summary['error_rows_inserted'] += $this->handler->saveErrors($desk, $lastErrors, $now);

            } catch (\Throwable $e) {
                Log::error('Error collecting data for desk '.$deskId.': '.$e->getMessage(), [
                    'exception' => $e,
                ]);
            }
        }

        return $summary;
    }
}
