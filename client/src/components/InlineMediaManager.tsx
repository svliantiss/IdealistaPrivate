// components/InlineMediaManager.tsx
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Upload, Video, Grid3x3, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MediaItem } from "@/store/query/property.queries";

interface InlineMediaManagerProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  uploadToR2: (file: File) => Promise<string>;
  className?: string;
}

// Sortable Media Item Component
function SortableMediaItem({ 
  item, 
  index, 
  onRemove, 
  onTitleChange 
}: {
  item: MediaItem;
  index: number;
  onRemove: (index: number) => void;
  onTitleChange: (index: number, title: string) => void;
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
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Number Badge */}
      <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
        {index + 1}
      </div>

      {/* Drag Handle */}
      <div 
        className="absolute top-2 right-2 z-10 cursor-grab active:cursor-grabbing bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity" 
        {...attributes} 
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>

      {/* Delete Button */}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-2 right-10 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Media Preview */}
      <div className="aspect-square rounded-md overflow-hidden border-2 border-muted">
        {item.type === "image" ? (
          <img
            src={item.url}
            alt={item.title || `Media ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Video className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Title Input */}
      <Input
        type="text"
        placeholder={`Title for image ${index + 1}`}
        value={item.title || ""}
        onChange={(e) => onTitleChange(index, e.target.value)}
        className="mt-2 text-xs h-8"
      />
    </div>
  );
}

export function InlineMediaManager({ 
  media, 
  onMediaChange, 
  uploadToR2,
  className = ""
}: InlineMediaManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
          toast.error(`${file.name} is not a valid image or video file`);
          return null;
        }

        const publicUrl = await uploadToR2(file);
        
        const newMediaItem: MediaItem = {
          type: isImage ? "image" : "video",
          url: publicUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
        };

        return newMediaItem;
      });

      const uploadedMedia = (await Promise.all(uploadPromises)).filter((item): item is MediaItem => item !== null);
      
      if (uploadedMedia.length > 0) {
        onMediaChange([...media, ...uploadedMedia]);
        toast.success(`${uploadedMedia.length} file(s) uploaded successfully!`);
      }

      // Reset file input
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = media.findIndex((_, i) => i.toString() === active.id);
      const newIndex = media.findIndex((_, i) => i.toString() === over.id);
      const newMediaOrder = arrayMove(media, oldIndex, newIndex);
      onMediaChange(newMediaOrder);
      toast.success('Media reordered');
    }
  };

  const handleRemoveMedia = (index: number) => {
    onMediaChange(media.filter((_, i) => i !== index));
    toast.success('Media removed');
  };

  const handleMediaTitleChange = (index: number, title: string) => {
    const newMedia = [...media];
    newMedia[index] = { ...newMedia[index], title };
    onMediaChange(newMedia);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="flex items-center justify-between">
        <span>Media</span>
        <Badge variant="outline" className="text-xs">
          {media.length} {media.length === 1 ? 'file' : 'files'}
        </Badge>
      </Label>
      
      {/* Upload Button */}
      <div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="media-upload-inline"
        />
        <Label
          htmlFor="media-upload-inline"
          className={`
            flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg
            cursor-pointer transition-all hover:border-primary hover:bg-primary/5
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span className="text-sm font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                Click to upload photos & videos
              </span>
            </>
          )}
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Supports: JPG, PNG, GIF, MP4, MOV, AVI. You can select multiple files at once.
        </p>
      </div>

      {/* Media Grid with Drag & Drop */}
      {media.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Drag to reorder • First image will be the thumbnail
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={media.map((_, index) => index.toString())}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item, index) => (
                  <SortableMediaItem
                    key={index}
                    item={item}
                    index={index}
                    onRemove={handleRemoveMedia}
                    onTitleChange={handleMediaTitleChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
          <Grid3x3 className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No media added yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload files using the button above</p>
        </div>
      )}
    </div>
  );
}
