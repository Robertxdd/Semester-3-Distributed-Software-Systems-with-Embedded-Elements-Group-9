<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_admin' => false,
        ]);

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'role' => ['required', 'in:user,admin'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Incorrect credentials'], 401);
        }

        if ($request->role === "admin" && !$user->is_admin) {
            return response()->json(['message' => 'You do not have administrator privileges'], 403);
        }

        if ($request->role === "user" && $user->is_admin) {
            return response()->json(['message' => 'An administrator cannot log in as a user'], 403);
        }

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'message' => 'Successful login',
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->tokens()->delete();
            $token = $user->currentAccessToken();
            if ($token) {
                $token->delete();
            } else {
                $bearer = $request->bearerToken();
                if ($bearer) {
                    $accessToken = PersonalAccessToken::findToken($bearer);
                    if ($accessToken) {
                        $accessToken->delete();
                    }
                }
            }
        }

        Auth::forgetGuards();

        return response()->json(['message' => 'Logout successful']);
    }

    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'All sessions have been closed']);
    }
}
