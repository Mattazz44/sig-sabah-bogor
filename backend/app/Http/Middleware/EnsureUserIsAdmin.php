<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Ensure the authenticated user holds the 'admin' role.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tidak terautentikasi.',
                ], 401);
            }

            return redirect()->route('login');
        }

        if (!$user->isAdmin()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Akses ditolak. Hanya administrator yang diizinkan.',
                ], 403);
            }

            abort(403, 'Akses ditolak. Halaman ini khusus Administrator.');
        }

        return $next($request);
    }
}
