<?php

namespace App\Http\Controllers;

use App\Http\Requests\CVDataRequest;
use App\Models\CVData;
use App\Services\CVPhotoStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class CVDataController extends Controller
{
    public function __construct(private readonly CVPhotoStorage $photos) {}

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

            if (isset($data[$relationName]) && is_array($data[$relationName]) && ! empty($data[$relationName])) {
                $childRows = [];
                $sortOrder = 0;
                foreach ($data[$relationName] as $item) {
                    if (! is_array($item)) {
                        continue;
                    }
                    $item['sort_order'] = $sortOrder++;
                    unset($item['id'], $item['cv_data_id'], $item['created_at'], $item['updated_at']);
                    $childRows[] = $item;
                }
                if (! empty($childRows)) {
                    $cv->{$relationName}()->createMany($childRows);
                }
            }
        }
    }

    private function resolveAddOnSections(CVData $cv): array
    {
        $defaults = [
            'portfolios' => $cv->portfolios->contains(fn ($item) => filled($item->title) || filled($item->link) || filled($item->description)),
            'certifications' => $cv->certifications->contains(fn ($item) => filled($item->name) || filled($item->organization)),
            'accomplishments' => $cv->accomplishments->contains(fn ($item) => filled($item->description)),
            'organizations' => $cv->organizations->contains(fn ($item) => filled($item->name) || filled($item->position) || filled($item->description)),
            'languages' => $cv->languages->contains(fn ($item) => filled($item->language)),
            'additional_info' => filled($cv->additional_info),
        ];
        $stored = $cv->custom_fields['enabled_sections'] ?? null;

        return is_array($stored) ? array_replace($defaults, $stored) : $defaults;
    }

    private function clientCustomFields(array $validated): array
    {
        $fields = (array) ($validated['custom_fields'] ?? []);

        return [
            'is_use_photo' => (bool) ($fields['is_use_photo'] ?? false),
            'enabled_sections' => (array) ($fields['enabled_sections'] ?? []),
        ];
    }

    private function serverPhotoFields(CVData $cv): array
    {
        return Arr::only((array) $cv->custom_fields, [
            'photo_disk',
            'photo_path',
            'photo_mime',
            'photo_base64',
        ]);
    }

    private function parentData(array $validated): array
    {
        return Arr::except($validated, [...$this->sectionRelations, 'photo', 'custom_fields']);
    }

    private function cvPayload(CVData $cv): array
    {
        $payload = $cv->toArray();
        $payload['custom_fields'] = Arr::except((array) $cv->custom_fields, [
            'photo_disk',
            'photo_path',
            'photo_mime',
            'photo_base64',
        ]);
        $payload['has_photo'] = $this->photos->hasPhoto($cv);
        $payload['photo_url'] = $payload['has_photo'] ? route('cvs.photo.show', $cv) : null;

        return $payload;
    }

    private function cleanupNewPhoto(array $metadata, ?CVData $cv): void
    {
        if ($metadata === [] || $cv === null) {
            return;
        }

        try {
            $this->photos->delete($metadata, $cv);
        } catch (Throwable $cleanupError) {
            Log::error('Failed to clean up a new CV photo after database failure.', [
                'cv_id' => $cv->getKey(),
                'error' => $cleanupError->getMessage(),
            ]);
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
        $cv = null;
        $newPhoto = [];

        try {
            DB::transaction(function () use ($validated, $request, &$cv, &$newPhoto) {
                $parent = $this->parentData($validated);
                $parent['custom_fields'] = $this->clientCustomFields($validated);
                $cv = $request->user()->cvs()->create($parent);

                if ($request->hasFile('photo')) {
                    $newPhoto = $this->photos->storeUpload($cv, $request->file('photo'));
                    $cv->update(['custom_fields' => array_merge($parent['custom_fields'], $newPhoto)]);
                }

                $this->replaceAllSections($cv, $validated);
            });
        } catch (Throwable $error) {
            $this->cleanupNewPhoto($newPhoto, $cv);
            throw $error;
        }

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
            'cv' => $this->cvPayload($cv),
            'addOnSections' => $this->resolveAddOnSections($cv),
        ]);
    }

    public function edit(Request $request, CVData $cv): Response
    {
        $cv = $this->authorizeOwnership($request, $cv);
        $cv->load($this->sectionRelations);

        $addOnSections = $this->resolveAddOnSections($cv);

        return Inertia::render('form-generate', [
            'cv' => $this->cvPayload($cv),
            'addOnSections' => $addOnSections,
            'isEdit' => true,
            'cvId' => $cv->id,
        ]);
    }

    public function update(CVDataRequest $request, CVData $cv)
    {
        $cv = $this->authorizeOwnership($request, $cv);
        $validated = $request->validated();
        $oldPhoto = $this->photos->metadata($cv);
        $newPhoto = [];

        try {
            DB::transaction(function () use ($cv, $validated, $request, &$newPhoto) {
                $parent = $this->parentData($validated);
                $photoFields = $this->serverPhotoFields($cv);

                if ($request->hasFile('photo')) {
                    $newPhoto = $this->photos->storeUpload($cv, $request->file('photo'));
                    $photoFields = $newPhoto;
                }

                $parent['custom_fields'] = array_merge($this->clientCustomFields($validated), $photoFields);
                $cv->update($parent);
                $this->replaceAllSections($cv, $validated);
            });
        } catch (Throwable $error) {
            $this->cleanupNewPhoto($newPhoto, $cv);
            throw $error;
        }

        if ($newPhoto !== [] && $oldPhoto !== []) {
            try {
                $this->photos->delete($oldPhoto, $cv);
            } catch (Throwable $cleanupError) {
                Log::warning('Failed to remove replaced CV photo.', [
                    'cv_id' => $cv->getKey(),
                    'error' => $cleanupError->getMessage(),
                ]);
            }
        }

        if ($request->expectsJson()) {
            return response()->json(['id' => $cv->id, 'message' => 'CV updated successfully']);
        }

        return redirect()->route('cvs.show', $cv->id);
    }

    public function showPhoto(Request $request, CVData $cv): StreamedResponse
    {
        $cv = $this->authorizeOwnership($request, $cv);

        abort_unless($this->photos->hasPhoto($cv), 404);

        return $this->photos->response($cv);
    }

    public function destroyPhoto(Request $request, CVData $cv)
    {
        $cv = $this->authorizeOwnership($request, $cv);
        $metadata = $this->photos->metadata($cv);

        DB::transaction(function () use ($cv, $metadata) {
            $fields = Arr::except((array) $cv->custom_fields, [
                'photo_disk',
                'photo_path',
                'photo_mime',
                'photo_base64',
            ]);
            $fields['is_use_photo'] = false;
            $cv->update(['custom_fields' => $fields]);
            $this->photos->delete($metadata, $cv);
        });

        return response()->noContent();
    }

    public function destroy(Request $request, CVData $cv)
    {
        $cv = $this->authorizeOwnership($request, $cv);
        $metadata = $this->photos->metadata($cv);

        DB::transaction(function () use ($cv, $metadata) {
            $this->photos->delete($metadata, $cv);
            $cv->delete();
        });

        if ($request->expectsJson()) {
            return response()->json(['message' => 'CV deleted successfully']);
        }

        return redirect()->route('cvs.index')->with('success', 'CV berhasil dihapus');
    }

    public function duplicate(Request $request, CVData $cv)
    {
        $cv = $this->authorizeOwnership($request, $cv);
        $cv->load($this->sectionRelations);
        $newCv = null;
        $newPhoto = [];

        try {
            DB::transaction(function () use ($cv, &$newCv, &$newPhoto) {
                $newCv = $cv->replicate();
                $newCv->cv_name = $newCv->cv_name ? $newCv->cv_name.' (Copy)' : 'Untitled CV (Copy)';
                $newCv->save();

                $newPhoto = $this->photos->copy($cv, $newCv);
                if ($newPhoto !== []) {
                    $fields = Arr::except((array) $newCv->custom_fields, [
                        'photo_disk',
                        'photo_path',
                        'photo_mime',
                        'photo_base64',
                    ]);
                    $newCv->update(['custom_fields' => array_merge($fields, $newPhoto)]);
                }

                foreach ($this->sectionRelations as $relationName) {
                    foreach ($cv->{$relationName} as $relatedModel) {
                        $newChild = $relatedModel->replicate();
                        $newCv->{$relationName}()->save($newChild);
                    }
                }
            });
        } catch (Throwable $error) {
            $this->cleanupNewPhoto($newPhoto, $newCv);
            throw $error;
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'CV duplicated successfully']);
        }

        return redirect()->route('cvs.index')->with('success', 'CV berhasil diduplikat');
    }
}
