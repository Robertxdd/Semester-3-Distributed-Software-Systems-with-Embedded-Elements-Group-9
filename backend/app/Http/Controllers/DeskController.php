<?php

namespace App\Http\Controllers;

use App\Models\Desk;
use Illuminate\Http\Request;

class DeskController extends Controller
{
    public function index()
    {
        return Desk::all();
    }

    public function store(Request $req)
    {
        $data = $req->validate([
            'name'        => 'required|string',
            'height'      => 'integer',
            'min_height'  => 'integer',
            'max_height'  => 'integer'
        ]);

        return Desk::create($data);
    }

    public function show(Desk $desk)
    {
        return $desk;
    }

    public function update(Request $req, Desk $desk)
    {
        $desk->update($req->only([
            'name', 'height', 'min_height', 'max_height', 'state'
        ]));

        return $desk;
    }

    public function destroy(Desk $desk)
    {
        $desk->delete();
        return ['deleted' => true];
    }

    // Movement logic with no speed value.
    public function moveUp(Desk $desk)
    {
        $desk->update([
            'height' => $desk->max_height,
            'state'  => 'stopped'
        ]);

        return $desk;
    }

    public function moveDown(Desk $desk)
    {
        $desk->update([
            'height' => $desk->min_height,
            'state'  => 'stopped'
        ]);

        return $desk;
    }

    public function stop(Desk $desk)
    {
        $desk->update(['state' => 'stopped']);
        return $desk;
    }
}
