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

                
                $desk = Desk::updateOrCreate(
                    ['external_id' => $deskId],
                    [
                        'name'         => $config['name'] ?? $deskId,
                        'manufacturer' => $config['manufacturer'] ?? null,
                    ]
                );

                
                if (!empty($state)) {
                    $this->handler->saveStateReading($desk, $state, $now);
                    $summary['state_rows_inserted']++;
                }

               
                if (!empty($usage)) {
                    $this->handler->saveUsageSnapshot($desk, $usage, $now);
                    $summary['usage_rows_inserted']++;
                }

               
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
