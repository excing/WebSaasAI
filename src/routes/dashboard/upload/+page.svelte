<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Progress } from "$lib/components/ui/progress";
    import { Check, FileImage, Upload, X } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    interface UploadedFile {
        id: string;
        name: string;
        url: string;
        size: number;
        type: string;
        uploadedAt: Date;
    }

    let uploading = $state(false);
    let uploadProgress = $state(0);
    let uploadedFiles = $state<UploadedFile[]>([]);
    let dragActive = $state(false);

    async function handleFileUpload(files: FileList | File[]) {
        const fileArray = Array.from(files);

        for (const file of fileArray) {
            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image file`);
                continue;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`);
                continue;
            }

            uploading = true;
            uploadProgress = 0;

            try {
                const formData = new FormData();
                formData.append("file", file);

                // Simulate progress
                const progressInterval = setInterval(() => {
                    uploadProgress = Math.min(
                        uploadProgress + Math.random() * 20,
                        90,
                    );
                }, 200);

                const response = await fetch("/api/upload-image", {
                    method: "POST",
                    body: formData,
                });

                clearInterval(progressInterval);
                uploadProgress = 100;

                if (!response.ok) {
                    throw new Error("Upload failed");
                }

                const { url } = await response.json();

                const uploadedFile: UploadedFile = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    url,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date(),
                };

                uploadedFiles = [uploadedFile, ...uploadedFiles];
                toast.success(`${file.name} uploaded successfully`);
            } catch (error) {
                console.error("Upload error:", error);
                toast.error(`Failed to upload ${file.name}`);
            } finally {
                uploading = false;
                uploadProgress = 0;
            }
        }
    }

    function handleDrag(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            dragActive = true;
        } else if (e.type === "dragleave") {
            dragActive = false;
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        dragActive = false;

        if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files);
        }
    }

    function handleInputChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            handleFileUpload(target.files);
        }
    }

    function removeFile(id: string) {
        uploadedFiles = uploadedFiles.filter((file) => file.id !== id);
    }

    function formatFileSize(bytes: number) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
</script>

<div class="space-y-6 p-6">
    <div>
        <h1 class="text-3xl font-semibold tracking-tight">File Upload</h1>
        <p class="text-muted-foreground mt-2">
            Upload images to Cloudflare R2 storage with drag and drop support
        </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
        <!-- Upload Area -->
        <Card.Root>
            <Card.Header>
                <Card.Title class="flex items-center gap-2">
                    <Upload class="h-5 w-5" />
                    Upload Images
                </Card.Title>
                <Card.Description>
                    Upload images to Cloudflare R2. Maximum file size is 5MB.
                </Card.Description>
            </Card.Header>
            <Card.Content class="space-y-4">
                <div
                    role="button"
                    tabindex="0"
                    class={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                        dragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    }`}
                    ondragenter={handleDrag}
                    ondragleave={handleDrag}
                    ondragover={handleDrag}
                    ondrop={handleDrop}
                >
                    <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onchange={handleInputChange}
                        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={uploading}
                    />
                    <div class="space-y-2">
                        <FileImage
                            class="text-muted-foreground mx-auto h-10 w-10"
                        />
                        <div>
                            <p class="text-sm font-medium">
                                {dragActive
                                    ? "Drop files here"
                                    : "Click to upload or drag and drop"}
                            </p>
                            <p class="text-muted-foreground text-xs">
                                PNG, JPG, GIF up to 5MB
                            </p>
                        </div>
                    </div>
                </div>

                {#if uploading}
                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} class="h-2" />
                    </div>
                {/if}
            </Card.Content>
        </Card.Root>

        <!-- Upload Info -->
        <Card.Root>
            <Card.Header>
                <Card.Title>About R2 Storage</Card.Title>
                <Card.Description
                    >Cloudflare R2 provides S3-compatible object storage</Card.Description
                >
            </Card.Header>
            <Card.Content class="space-y-4">
                <div class="space-y-3">
                    <div class="flex items-start gap-3">
                        <Check class="mt-0.5 h-4 w-4 text-green-500" />
                        <div class="text-sm">
                            <p class="font-medium">Global CDN</p>
                            <p class="text-muted-foreground">
                                Fast delivery worldwide
                            </p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <Check class="mt-0.5 h-4 w-4 text-green-500" />
                        <div class="text-sm">
                            <p class="font-medium">Zero Egress Fees</p>
                            <p class="text-muted-foreground">
                                No bandwidth charges
                            </p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <Check class="mt-0.5 h-4 w-4 text-green-500" />
                        <div class="text-sm">
                            <p class="font-medium">S3 Compatible</p>
                            <p class="text-muted-foreground">
                                Works with existing tools
                            </p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <Check class="mt-0.5 h-4 w-4 text-green-500" />
                        <div class="text-sm">
                            <p class="font-medium">Auto Scaling</p>
                            <p class="text-muted-foreground">
                                Handles any file size
                            </p>
                        </div>
                    </div>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <!-- Uploaded Files -->
    {#if uploadedFiles.length > 0}
        <Card.Root>
            <Card.Header>
                <Card.Title>Uploaded Files ({uploadedFiles.length})</Card.Title>
                <Card.Description
                    >Recently uploaded images to R2 storage</Card.Description
                >
            </Card.Header>
            <Card.Content>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {#each uploadedFiles as file}
                        <div
                            class="group relative overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
                        >
                            <div class="bg-muted relative aspect-video">
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    class="h-full w-full object-cover"
                                />
                            </div>
                            <div class="p-3">
                                <p
                                    class="truncate text-sm font-medium"
                                    title={file.name}
                                >
                                    {file.name}
                                </p>
                                <div
                                    class="text-muted-foreground mt-1 flex items-center justify-between text-xs"
                                >
                                    <span>{formatFileSize(file.size)}</span>
                                    <span
                                        >{file.uploadedAt.toLocaleDateString()}</span
                                    >
                                </div>
                                <div class="mt-2 flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onclick={() =>
                                            navigator.clipboard.writeText(
                                                file.url,
                                            )}
                                        class="flex-1 text-xs"
                                    >
                                        Copy URL
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onclick={() =>
                                            window.open(file.url, "_blank")}
                                        class="flex-1 text-xs"
                                    >
                                        Open
                                    </Button>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onclick={() => removeFile(file.id)}
                                class="bg-background/80 hover:bg-background absolute right-2 top-2 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <X class="h-4 w-4" />
                            </Button>
                        </div>
                    {/each}
                </div>
            </Card.Content>
        </Card.Root>
    {/if}
</div>
