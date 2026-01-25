// components/MediaManager.tsx
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grid3x3, Upload, Image as ImageIcon, Video, X, GripVertical, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { MediaItem } from "@/store/query/property.queries";

interface MediaManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  uploadToR2: (file: File) => Promise<string>;
}

interface PendingMediaItem {
  type: "image" | "video";
  file: File;
  title: string;
  isUploading?: boolean;
}

function SortableMediaItem({ item, index, onRemove, onTitleChange }: {
  item: MediaItem;
  index: number;
  onRemove: (index: number) => void;
  onTitleChange: (index: number, title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = () => {
    onTitleChange(index, title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitle(item.title);
      setIsEditing(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group border rounded-md overflow-hidden bg-white">
      <div className="absolute top-2 left-2 z-10 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-white/80" />
      </div>

      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-6 w-6 bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-3 w-3 text-white" />
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="aspect-video">
        {item.type === "image" ? (
          <img
            src={item.url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
            <Video className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Video</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 min-h-[40px]">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-6 text-xs text-white bg-black/50 border-white/30 placeholder:text-white/50"
              placeholder="Enter title"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleSaveTitle}
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-white text-xs cursor-pointer" onClick={() => setIsEditing(true)}>
            {item.type === "image" ? (
              <ImageIcon className="h-3 w-3 flex-shrink-0" />
            ) : (
              <Video className="h-3 w-3 flex-shrink-0" />
            )}
            <span className="truncate">{item.title || "Untitled"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MediaManager({ open, onOpenChange, media, onMediaChange, uploadToR2 }: MediaManagerProps) {
  const [pendingUploads, setPendingUploads] = useState<PendingMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = media.findIndex((_, i) => i.toString() === active.id);
      const newIndex = media.findIndex((_, i) => i.toString() === over.id);
      const newMediaOrder = arrayMove(media, oldIndex, newIndex);
      onMediaChange(newMediaOrder);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: PendingMediaItem[] = [];

    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast.error(`"${file.name}" is not a valid image or video file`);
        return;
      }

      validFiles.push({
        type: isImage ? "image" : "video" as "image" | "video",
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
      });
    });

    if (validFiles.length > 0) {
      setPendingUploads(prev => [...prev, ...validFiles]);
      toast.success(`Added ${validFiles.length} file(s) to upload queue`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadAll = async () => {
    if (pendingUploads.length === 0) {
      toast.error('Please select files to upload first');
      return;
    }

    setUploading(true);
    const uploadedItems: MediaItem[] = [];
    const remainingUploads = [...pendingUploads];

    try {
      // Process uploads sequentially
      for (const pendingItem of remainingUploads) {
        const itemIndex = pendingUploads.findIndex(item => item.file === pendingItem.file);
        
        // Mark as uploading
        setPendingUploads(prev => prev.map((item, idx) => 
          idx === itemIndex ? { ...item, isUploading: true } : item
        ));

        try {
          const publicUrl = await uploadToR2(pendingItem.file);
          
          uploadedItems.push({
            type: pendingItem.type,
            url: publicUrl,
            title: pendingItem.title || pendingItem.file.name.replace(/\.[^/.]+$/, ""),
          });

          // Remove from pending after successful upload
          setPendingUploads(prev => prev.filter(item => item.file !== pendingItem.file));
          
        } catch (error) {
          console.error(`Failed to upload ${pendingItem.file.name}:`, error);
          toast.error(`Failed to upload "${pendingItem.file.name}"`);
          
          // Remove uploading state
          setPendingUploads(prev => prev.map(item => 
            item.file === pendingItem.file ? { ...item, isUploading: false } : item
          ));
        }
      }

      // Add all uploaded items to media library
      if (uploadedItems.length > 0) {
        onMediaChange([...media, ...uploadedItems]);
        toast.success(`Successfully uploaded ${uploadedItems.length} file(s)!`);
      }
    } catch (error) {
      console.error('Upload process failed:', error);
      toast.error('Upload process failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePending = (index: number) => {
    setPendingUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveMedia = (index: number) => {
    const newMediaArray = media.filter((_, i) => i !== index);
    onMediaChange(newMediaArray);
    toast.success('Media removed');
  };

  const handleTitleChange = (index: number, title: string) => {
    const newMediaArray = [...media];
    newMediaArray[index] = { ...newMediaArray[index], title };
    onMediaChange(newMediaArray);
  };

  const handleSaveChanges = () => {
    toast.success('Media changes saved');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Manage Property Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Upload Media</h3>

            <div className="space-y-4">
              <div>
                <Label>Upload Files</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    className="cursor-pointer"
                    multiple
                  />
                  <Button
                    type="button"
                    onClick={handleUploadAll}
                    disabled={uploading || pendingUploads.length === 0}
                    className="whitespace-nowrap"
                  >
                    {uploading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload All ({pendingUploads.length})
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select multiple images and videos (JPG, PNG, GIF, MP4, MOV, AVI)
                </p>
              </div>

              {/* Pending Uploads */}
              {pendingUploads.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Files to upload ({pendingUploads.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pendingUploads.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {item.isUploading ? (
                            <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                          ) : item.type === "image" ? (
                            <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          ) : (
                            <Video className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{item.file.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({(item.file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={item.title}
                            onChange={(e) => {
                              const newUploads = [...pendingUploads];
                              newUploads[index].title = e.target.value;
                              setPendingUploads(newUploads);
                            }}
                            className="h-6 text-xs w-32"
                            placeholder="Title (optional)"
                            disabled={item.isUploading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6"
                            onClick={() => handleRemovePending(index)}
                            disabled={item.isUploading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Media Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Media Library ({media.length} items)</h3>
              <p className="text-sm text-muted-foreground">
                Drag to reorder • First image will be used as thumbnail
              </p>
            </div>

            {media.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={media.map((_, index) => index.toString())}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {media.map((item, index) => (
                      <SortableMediaItem
                        key={index}
                        item={item}
                        index={index}
                        onRemove={handleRemoveMedia}
                        onTitleChange={handleTitleChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Grid3x3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-semibold mb-2">No media yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload images or videos to showcase your property
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveChanges}
              className="bg-primary hover:bg-primary/90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}