<?php

namespace App\Http\Controllers;

use App\Http\Requests\CVDataRequest;
use App\Models\CVData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CVDataController extends Controller
{
    private array $sectionRelations = [
        'work_experience',
        'education',
        'skills',
        'portfolios',
        'certifications',
        'languages',
        'accomplishments',
        'organizations',
    ];

    private function authorizeOwnership(Request $request, CVData $cv): CVData
    {
        return $request->user()->cvs()->whereKey($cv->getKey())->firstOrFail();
    }

    private function replaceAllSections(CVData $cv, array $data): void
    {
        foreach ($this->sectionRelations as $relationName) {
            // Hard-delete existing child rows
            $cv->{$relationName}()->delete();

            if (isset($data[$relationName]) && is_array($data[$relationName]) && !empty($data[$relationName])) {
                $childRows = [];
                $sortOrder = 0;
                foreach ($data[$relationName] as $item) {
                    if (!is_array($item)) {
                        continue;
                    }
                    $item['sort_order'] = $sortOrder++;
                    unset($item['id'], $item['cv_data_id'], $item['created_at'], $item['updated_at']);
                    $childRows[] = $item;
                }
                if (!empty($childRows)) {
                    $cv->{$relationName}()->createMany($childRows);
                }
            }
        }
    }

    public function index(): Response
    {
        $cvs = auth()->user()->cvs()
            ->orderByDesc('updated_at')
            ->get(['id', 'cv_name', 'name', 'email', 'created_at', 'updated_at']);

        return Inertia::render('cvs/index', [
            'cvs' => $cvs,
        ]);
    }

    public function store(CVDataRequest $request)
    {
        $validated = $request->validated();

        $cv = DB::transaction(function () use ($validated, $request) {
            $cv = $request->user()->cvs()->create($validated);
            $this->replaceAllSections($cv, $validated);
            return $cv;
        });

        if ($request->expectsJson()) {
            return response()->json(['id' => $cv->id, 'message' => 'CV saved successfully'], 201);
        }

        return redirect()->route('cvs.show', $cv->id);
    }

    public function show(Request $request, CVData $cv): Response
    {
        $cv = $this->authorizeOwnership($request, $cv);
        $cv->load($this->sectionRelations);

        return Inertia::render('cvs/show', [
            'cv' => $cv,
        ]);
    }

    public function edit(Request $request, CVData $cv): Response
    {
        $cv = $this->authorizeOwnership($request, $cv);
        $cv->load($this->sectionRelations);

        $addOnSections = [
            'portfolios' => $cv->portfolios->isNotEmpty(),
            'certifications' => $cv->certifications->isNotEmpty(),
            'accomplishments' => $cv->accomplishments->isNotEmpty(),
            'organizations' => $cv->organizations->isNotEmpty(),
            'languages' => $cv->languages->isNotEmpty(),
            'additional_info' => ! empty($cv->additional_info),
        ];

        return Inertia::render('form-generate', [
            'cv' => $cv,
            'addOnSections' => $addOnSections,
            'isEdit' => true,
            'cvId' => $cv->id,
        ]);
    }

    public function update(CVDataRequest $request, CVData $cv)
    {
        $cv = $this->authorizeOwnership($request, $cv);
        $validated = $request->validated();

        DB::transaction(function () use ($cv, $validated) {
            $cv->update($validated);
            $this->replaceAllSections($cv, $validated);
        });

        if ($request->expectsJson()) {
            return response()->json(['id' => $cv->id, 'message' => 'CV updated successfully']);
        }

        return redirect()->route('cvs.show', $cv->id);
    }

    public function destroy(Request $request, CVData $cv)
    {
        $cv = $this->authorizeOwnership($request, $cv);

        DB::transaction(function () use ($cv) {
            $cv->delete();
        });

        if ($request->expectsJson()) {
            return response()->json(['message' => 'CV deleted successfully']);
        }

        return redirect()->route('cvs.index')->with('success', 'CV berhasil dihapus');
    }
}
