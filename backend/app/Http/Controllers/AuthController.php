<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validar datos
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'role' => 'required'
        ]);

        // Buscar usuario
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // SOLO DOS ROLES: admin vs usuario normal
        if ($request->role === "admin" && !$user->is_admin) {
            return response()->json(['message' => 'No tienes permisos de administrador'], 403);
        }

        if ($request->role === "user" && $user->is_admin) {
            return response()->json(['message' => 'Un administrador no puede iniciar sesión como usuario'], 403);
        }

        // Generar token
        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => $user
        ]);
    }
}
