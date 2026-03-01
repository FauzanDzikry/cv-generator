<?php

namespace App\Http\Controllers;

use App\Models\CVData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CVDataController extends Controller
{
    public function index(): Response
    {
        $cvs = CVData::where('user_id', auth()->id())
            ->orderByDesc('updated_at')
            ->get(['id', 'cv_name', 'name', 'email', 'created_at', 'updated_at']);

        return Inertia::render('cvs/index', [
            'cvs' => $cvs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cv_name' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email'],
            'linkedin' => ['nullable', 'string', 'max:500'],
            'summary' => ['required', 'string'],
            'work_experience' => ['required', 'array'],
            'education' => ['required', 'array'],
            'skills' => ['required', 'array'],
            'portfolios' => ['nullable', 'array'],
            'certifications' => ['nullable', 'array'],
            'languages' => ['nullable', 'array'],
            'accomplishments' => ['nullable', 'array'],
            'organizations' => ['nullable', 'array'],
            'additional_info' => ['nullable', 'string'],
            'custom_fields' => ['nullable', 'array'],
        ]);

        $validated['user_id'] = auth()->id();

        $cv = CVData::create($validated);

        if ($request->expectsJson()) {
            return response()->json(['id' => $cv->id, 'message' => 'CV saved successfully'], 201);
        }

        return redirect()->route('cvs.show', $cv->id);
    }

    public function show(int $id): Response
    {
        $cv = CVData::where('id', $id)->firstOrFail();

        if ((int) $cv->user_id !== (int) auth()->id()) {
            abort(404);
        }

        return Inertia::render('cvs/show', [
            'cv' => $cv,
        ]);
    }

    public function edit(int $id): Response
    {
        $cv = CVData::where('id', $id)->firstOrFail();

        if ((int) $cv->user_id !== (int) auth()->id()) {
            abort(404);
        }

        $addOnSections = [
            'portfolios' => ! empty($cv->portfolios),
            'certifications' => ! empty($cv->certifications),
            'accomplishments' => ! empty($cv->accomplishments),
            'organizations' => ! empty($cv->organizations),
            'languages' => ! empty($cv->languages),
            'additional_info' => ! empty($cv->additional_info),
        ];

        return Inertia::render('form-generate', [
            'cv' => $cv,
            'addOnSections' => $addOnSections,
            'isEdit' => true,
            'cvId' => $id,
        ]);
    }

    public function update(Request $request, int $id)
    {
        $cv = CVData::where('id', $id)->firstOrFail();

        if ((int) $cv->user_id !== (int) auth()->id()) {
            abort(404);
        }

        $validated = $request->validate([
            'cv_name' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email'],
            'linkedin' => ['nullable', 'string', 'max:500'],
            'summary' => ['required', 'string'],
            'work_experience' => ['required', 'array'],
            'education' => ['required', 'array'],
            'skills' => ['required', 'array'],
            'portfolios' => ['nullable', 'array'],
            'certifications' => ['nullable', 'array'],
            'languages' => ['nullable', 'array'],
            'accomplishments' => ['nullable', 'array'],
            'organizations' => ['nullable', 'array'],
            'additional_info' => ['nullable', 'string'],
            'custom_fields' => ['nullable', 'array'],
        ]);

        $cv->update($validated);

        if ($request->expectsJson()) {
            return response()->json(['id' => $cv->id, 'message' => 'CV updated successfully']);
        }

        return redirect()->route('cvs.show', $cv->id);
    }
}
