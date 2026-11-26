<?php

namespace App\Console\Commands;

use App\Models\SavedActivity;
use App\Models\TouristSpot;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DeduplicateTouristSpots extends Command
{
    protected $signature = 'spots:deduplicate
        {--dry-run : Tampilkan duplikat yang terdeteksi tanpa mengubah database}
        {--radius=15 : Toleransi jarak tumpang tindih koordinat spasial dalam meter}';

    protected $description = 'Mendeteksi dan menghapus baris duplikat pada tabel tourist_spots berdasarkan nama/slug serupa atau koordinat spasial yang bertumpuk.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $radiusMeters = max(1.0, (float) $this->option('radius'));

        $spots = TouristSpot::query()->orderBy('id')->get();
        if ($spots->count() < 2) {
            $this->info('Tidak ada duplikat untuk diproses.');
            return self::SUCCESS;
        }

        // Hitung referensi saved_activities agar record yang dipakai pengguna diprioritaskan tetap bertahan
        $savedCounts = SavedActivity::query()
            ->whereNotNull('tourist_spot_id')
            ->select('tourist_spot_id', DB::raw('COUNT(*) as total'))
            ->groupBy('tourist_spot_id')
            ->pluck('total', 'tourist_spot_id');

        // Fase 1: Duplikat nama kanonik atau sub-venue dalam alamat gedung yang sama (<= 100m)
        // Fase 2: Tumpang tindih koordinat spasial (<= radius) pada survivor tersisa (mencegah penggabungan transitif pada landmark berbeda seperti Lawang Salapan)
        $plan = $this->buildDeduplicationPlan($spots, $savedCounts, $radiusMeters);

        if (empty($plan)) {
            $this->info("Database bersih: 0 duplikat ditemukan dari {$spots->count()} destinasi wisata.");
            return self::SUCCESS;
        }

        $totalRemoved = 0;
        $totalReassigned = 0;

        $execute = function () use ($plan, $dryRun, &$totalRemoved, &$totalReassigned): void {
            foreach ($plan as $entry) {
                /** @var TouristSpot $survivor */
                $survivor = $entry['survivor'];
                /** @var array<int, TouristSpot> $duplicates */
                $duplicates = $entry['duplicates'];

                $this->line(sprintf(
                    '<info>Pertahankan</info> #%d [%s] (%s) @ %.6f, %.6f',
                    $survivor->id,
                    $survivor->slug,
                    $survivor->name,
                    (float) $survivor->latitude,
                    (float) $survivor->longitude
                ));

                foreach ($duplicates as $dup) {
                    $distM = $this->haversineMeters(
                        (float) $survivor->latitude,
                        (float) $survivor->longitude,
                        (float) $dup->latitude,
                        (float) $dup->longitude
                    );

                    $this->line(sprintf(
                        '  <comment>%s</comment> #%d [%s] (%s) @ %.6f, %.6f (jarak %.1fm, alasan: %s)',
                        $dryRun ? 'Akan dihapus' : 'Menghapus',
                        $dup->id,
                        $dup->slug,
                        $dup->name,
                        (float) $dup->latitude,
                        (float) $dup->longitude,
                        $distM,
                        $entry['reason']
                    ));

                    if (!$dryRun) {
                        $reassigned = SavedActivity::query()
                            ->where('tourist_spot_id', $dup->id)
                            ->update(['tourist_spot_id' => $survivor->id]);
                        $totalReassigned += $reassigned;

                        $dup->delete();
                    }
                    $totalRemoved++;
                }
            }
        };

        if ($dryRun) {
            $execute();
            $this->warn("Mode dry-run selesai: {$totalRemoved} duplikat terdeteksi (belum dihapus).");
            return self::SUCCESS;
        }

        DB::transaction($execute);

        $remaining = TouristSpot::query()->count();
        $this->info("Pembersihan selesai: {$totalRemoved} duplikat dihapus, {$totalReassigned} relasi saved_activities dipindahkan, tersisa {$remaining} destinasi unik.");

        return self::SUCCESS;
    }

    /**
     * Susun rencana deduplikasi 2 fase (nama/venue dulu, lalu tumpang tindih koordinat spasial).
     *
     * @param  Collection<int, TouristSpot>  $spots
     * @return array<int, array{survivor: TouristSpot, duplicates: array<int, TouristSpot>, reason: string}>
     */
    private function buildDeduplicationPlan(Collection $spots, Collection $savedCounts, float $radiusMeters): array
    {
        $items = $spots->values()->all();
        $plan = [];

        // Fase 1: Kelompokkan berdasarkan nama kanonik identik atau sub-venue pada gedung/jalan sama (<= 100m)
        $phase1Groups = $this->clusterItems($items, function (array $a, array $b, float $distM): bool {
            if ($a['nameKey'] !== '' && $a['nameKey'] === $b['nameKey']) {
                return true;
            }
            return $distM <= 100.0
                && $a['streetKey'] !== ''
                && $a['streetKey'] === $b['streetKey']
                && strlen($a['nameKey']) >= 10
                && strlen($b['nameKey']) >= 10
                && (str_contains($a['nameKey'], $b['nameKey']) || str_contains($b['nameKey'], $a['nameKey']));
        });

        $removedIds = [];
        foreach ($phase1Groups as $group) {
            $survivor = $this->pickSurvivor($group, $savedCounts);
            $dups = array_values(array_filter($group, fn (TouristSpot $s) => $s->id !== $survivor->id));
            foreach ($dups as $d) {
                $removedIds[$d->id] = true;
            }
            $plan[] = ['survivor' => $survivor, 'duplicates' => $dups, 'reason' => 'nama/venue duplikat'];
        }

        // Fase 2: Kelompokkan survivor tersisa berdasarkan tumpang tindih koordinat spasial (<= radius)
        $remaining = array_values(array_filter($items, fn (TouristSpot $s) => !isset($removedIds[$s->id])));
        $phase2Groups = $this->clusterItems($remaining, fn (array $a, array $b, float $distM): bool => $distM <= $radiusMeters);

        foreach ($phase2Groups as $group) {
            $survivor = $this->pickSurvivor($group, $savedCounts);
            $dups = array_values(array_filter($group, fn (TouristSpot $s) => $s->id !== $survivor->id));
            $plan[] = ['survivor' => $survivor, 'duplicates' => $dups, 'reason' => 'koordinat bertumpuk'];
        }

        return $plan;
    }

    /**
     * @param  array<int, TouristSpot>  $items
     * @param  callable(array, array, float): bool  $matcher
     * @return array<int, array<int, TouristSpot>>
     */
    private function clusterItems(array $items, callable $matcher): array
    {
        $count = count($items);
        if ($count < 2) {
            return [];
        }

        $parent = range(0, $count - 1);
        $find = function (int $x) use (&$parent, &$find): int {
            if ($parent[$x] !== $x) {
                $parent[$x] = $find($parent[$x]);
            }
            return $parent[$x];
        };
        $union = function (int $a, int $b) use (&$parent, $find): void {
            $ra = $find($a);
            $rb = $find($b);
            if ($ra !== $rb) {
                $parent[max($ra, $rb)] = min($ra, $rb);
            }
        };

        $meta = [];
        foreach ($items as $idx => $spot) {
            $meta[$idx] = [
                'nameKey' => self::canonicalNameKey((string) $spot->name),
                'streetKey' => self::streetKey($spot->address),
                'lat' => (float) $spot->latitude,
                'lng' => (float) $spot->longitude,
            ];
        }

        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                $distM = $this->haversineMeters(
                    $meta[$i]['lat'],
                    $meta[$i]['lng'],
                    $meta[$j]['lat'],
                    $meta[$j]['lng']
                );
                if ($matcher($meta[$i], $meta[$j], $distM)) {
                    $union($i, $j);
                }
            }
        }

        $buckets = [];
        for ($i = 0; $i < $count; $i++) {
            $buckets[$find($i)][] = $items[$i];
        }

        return array_values(array_filter($buckets, fn (array $grp) => count($grp) > 1));
    }

    /**
     * Pilih 1 record terbaik untuk dipertahankan: prioritaskan referensi saved_activities,
     * venue induk (nama tidak mengandung prefix tenant), kelengkapan deskripsi/foto, dan ID terkecil.
     *
     * @param  array<int, TouristSpot>  $group
     */
    private function pickSurvivor(array $group, Collection $savedCounts): TouristSpot
    {
        $nameKeys = array_map(fn (TouristSpot $s) => self::canonicalNameKey((string) $s->name), $group);

        usort($group, function (TouristSpot $a, TouristSpot $b) use ($savedCounts, $nameKeys): int {
            $scoreA = $this->completenessScore($a, (int) ($savedCounts[$a->id] ?? 0), $nameKeys);
            $scoreB = $this->completenessScore($b, (int) ($savedCounts[$b->id] ?? 0), $nameKeys);

            if ($scoreA !== $scoreB) {
                return $scoreB <=> $scoreA;
            }
            return $a->id <=> $b->id;
        });

        return $group[0];
    }

    /**
     * @param  array<int, string>  $groupNameKeys
     */
    private function completenessScore(TouristSpot $spot, int $savedRefCount, array $groupNameKeys): int
    {
        $score = $savedRefCount * 200;

        if (!empty(trim((string) $spot->image))) {
            $score += 100;
        }

        $detailed = trim((string) $spot->detailed_description);
        if ($detailed !== '' && strtolower($detailed) !== 'kosong' && strlen($detailed) >= 100) {
            $score += 50;
        }

        $descLen = strlen(trim((string) $spot->description));
        $score += min(80, (int) floor($descLen / 2));

        // Jika nama kanonik tempat ini terkandung di dalam nama kandidat lain yang lebih panjang (mis. mall induk vs tenant),
        // berikan prioritas kepada venue induk.
        $myKey = self::canonicalNameKey((string) $spot->name);
        foreach ($groupNameKeys as $otherKey) {
            if ($otherKey !== $myKey && strlen($myKey) >= 10 && str_contains($otherKey, $myKey)) {
                $score += 45;
                break;
            }
        }

        return $score;
    }

    public static function canonicalNameKey(string $name): string
    {
        $normalized = mb_strtolower(trim($name));
        $normalized = preg_replace('/\b(kota\s+bogor|bogor\s+kota|bogor)\b/u', '', $normalized) ?? $normalized;
        $normalized = preg_replace('/[^a-z0-9]+/u', '', $normalized) ?? $normalized;
        return trim($normalized);
    }

    public static function streetKey(?string $address): string
    {
        if (!$address) {
            return '';
        }
        $parts = array_map('trim', explode(',', $address));
        foreach ($parts as $part) {
            if (preg_match('/^(jl\.?|jalan)\s+.+\d+/i', $part)) {
                $clean = mb_strtolower($part);
                $clean = preg_replace('/^jalan\b/u', 'jl', $clean) ?? $clean;
                $clean = preg_replace('/[^a-z0-9]+/u', ' ', $clean) ?? $clean;
                return trim($clean);
            }
        }
        return '';
    }

    private function haversineMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 2.0 * $earthRadius * asin(min(1.0, sqrt($a)));
    }
}
