<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function requireRole($user, array $roles)
    {
        $role = $user->role ?? ($user->is_admin ? 'ADMIN' : 'OCCUPANT');
        if (!in_array($role, $roles, true)) {
            abort(403, 'Forbidden');
        }
    }
}
