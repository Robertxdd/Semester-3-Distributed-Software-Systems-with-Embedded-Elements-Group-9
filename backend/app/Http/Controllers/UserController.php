<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->requireRole($request->user(), ['ADMIN']);

        $users = User::select('id', 'name', 'email', 'role', 'is_admin')->get();

        return response()->json($users);
    }
}
