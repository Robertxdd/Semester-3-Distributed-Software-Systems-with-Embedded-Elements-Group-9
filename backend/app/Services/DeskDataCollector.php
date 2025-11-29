<?php

namespace App\Services;

use App\Models\Desk;
use App\Models\DeskError;
use App\Models\DeskStateReading;
use App\Models\DeskUsageSnapshot;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class DeskDataCollector
{
    public function __construct(
        protected DeskSimulatorClient $client,
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
                    DeskStateReading::create([
                        'desk_id'                    => $desk->id,
                        'position_mm'                => $state['position_mm']        ?? null,
                        'speed_mms'                  => $state['speed_mms']          ?? null,
                        'status'                     => $state['status']             ?? null,
                        'is_position_lost'           => $state['isPositionLost']     ?? false,
                        'is_overload_protection_up'  => $state['isOverloadProtectionUp']   ?? false,
                        'is_overload_protection_down'=> $state['isOverloadProtectionDown'] ?? false,
                        'is_anti_collision'          => $state['isAntiCollision']    ?? false,
                        'collected_at'               => $now,
                    ]);

                    $summary['state_rows_inserted']++;
                }

                // 3) Guardar uso (usage)
                if (!empty($usage)) {
                    DeskUsageSnapshot::create([
                        'desk_id'            => $desk->id,
                        'activations_counter'=> $usage['activationsCounter'] ?? null,
                        'sit_stand_counter'  => $usage['sitStandCounter']    ?? null,
                        'collected_at'       => $now,
                    ]);

                    $summary['usage_rows_inserted']++;
                }

                // 4) Guardar errores (lastErrors)
                foreach ($lastErrors as $error) {
                    $created = DeskError::firstOrCreate(
                        [
                            'desk_id'   => $desk->id,
                            'error_code'=> $error['errorCode'] ?? null,
                            'time_s'    => $error['time_s']    ?? null,
                        ],
                        [
                            'collected_at' => $now,
                        ]
                    );

                    if ($created->wasRecentlyCreated) {
                        $summary['error_rows_inserted']++;
                    }
                }

            } catch (\Throwable $e) {
                Log::error('Error collecting data for desk '.$deskId.': '.$e->getMessage(), [
                    'exception' => $e,
                ]);
            }
        }

        return $summary;
    }
}
