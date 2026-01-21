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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Grid3x3, Upload, Image as ImageIcon, Video, X, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MediaItem } from "@/store/query/property.queries";

interface MediaManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  uploadToR2: (file: File) => Promise<string>;
}

function SortableMediaItem({ item, index, onRemove }: {
  item: MediaItem;
  index: number;
  onRemove: (index: number) => void;
}) {
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

  return (
    <div ref={setNodeRef} style={style} className="relative group border rounded-md overflow-hidden bg-white">
      <div className="absolute top-2 left-2 z-10 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-white/80" />
      </div>

      <div className="absolute top-2 right-2 z-10">
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
            <span className="text-xs text-gray-500">{item.title}</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center gap-1 text-white text-xs">
          {item.type === "image" ? (
            <ImageIcon className="h-3 w-3" />
          ) : (
            <Video className="h-3 w-3" />
          )}
          <span className="truncate">{item.title}</span>
        </div>
      </div>
    </div>
  );
}

export function MediaManager({ open, onOpenChange, media, onMediaChange, uploadToR2 }: MediaManagerProps) {
  const [newMedia, setNewMedia] = useState<Omit<MediaItem, 'url'> & { file?: File }>({
    type: "image",
    title: "",
  });
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
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file');
      return;
    }

    setNewMedia(prev => ({
      ...prev,
      type: isImage ? "image" : "video",
      file,
      title: file.name.replace(/\.[^/.]+$/, ""),
    }));
  };

  const handleUpload = async () => {
    if (!newMedia.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      const publicUrl = await uploadToR2(newMedia.file);
      
      const newMediaItem: MediaItem = {
        type: newMedia.type,
        url: publicUrl,
        title: newMedia.title || newMedia.file.name.replace(/\.[^/.]+$/, ""),
      };

      onMediaChange([...media, newMediaItem]);
      
      toast.success('Media uploaded successfully!');
      setNewMedia({
        type: "image",
        title: "",
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newMediaArray = media.filter((_, i) => i !== index);
    onMediaChange(newMediaArray);
    toast.success('Media removed');
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
            <h3 className="font-semibold">Add New Media</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="mediaType">Media Type</Label>
                <Select
                  value={newMedia.type}
                  onValueChange={(value: "image" | "video") =>
                    setNewMedia(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="mediaTitle">Title</Label>
                <Input
                  id="mediaTitle"
                  value={newMedia.title}
                  onChange={(e) => setNewMedia(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter media title"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Upload File</Label>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: JPG, PNG, GIF, MP4, MOV, AVI
                </p>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !newMedia.file}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Add
                    </>
                  )}
                </Button>
              </div>
            </div>

            {newMedia.file && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {newMedia.type === "image" ? (
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Video className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">{newMedia.file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(newMedia.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewMedia(prev => ({ ...prev, file: undefined }));
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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