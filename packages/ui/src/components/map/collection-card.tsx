import * as React from 'react';
import {
  Folder,
  Bookmark,
  Heart,
  Star,
  Coffee,
  Utensils,
  Camera,
  MapPin,
  MoreVertical,
  Edit2,
  Trash2,
  Share2,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from '../button.js';
import { Input } from '../input.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../dialog.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu.js';

export const COLLECTION_COLORS = [
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Emerald', value: '#10b981', bgClass: 'bg-emerald-500' },
  { name: 'Amber', value: '#f59e0b', bgClass: 'bg-amber-500' },
  { name: 'Rose', value: '#f43f5e', bgClass: 'bg-rose-500' },
  { name: 'Purple', value: '#8b5cf6', bgClass: 'bg-purple-500' },
  { name: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500' },
  { name: 'Cyan', value: '#06b6d4', bgClass: 'bg-cyan-500' },
  { name: 'Stone', value: '#78716c', bgClass: 'bg-stone-500' },
];

export const COLLECTION_ICONS = [
  { id: 'folder', name: 'Folder', icon: Folder },
  { id: 'bookmark', name: 'Bookmark', icon: Bookmark },
  { id: 'heart', name: 'Favorite', icon: Heart },
  { id: 'star', name: 'Starred', icon: Star },
  { id: 'coffee', name: 'Cafe', icon: Coffee },
  { id: 'utensils', name: 'Food', icon: Utensils },
  { id: 'camera', name: 'Sights', icon: Camera },
  { id: 'pin', name: 'Places', icon: MapPin },
];

export function getCollectionIconComponent(iconId?: string) {
  const match = COLLECTION_ICONS.find((i) => i.id === iconId);
  return match ? match.icon : Folder;
}

export interface CollectionCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  id: string;
  name: string;
  description?: string;
  placesCount?: number;
  color?: string;
  icon?: string;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
}

export const CollectionCard = React.forwardRef<HTMLDivElement, CollectionCardProps>(
  (
    {
      className,
      id,
      name,
      description,
      placesCount = 0,
      color = '#3b82f6',
      icon = 'folder',
      onSelect,
      onEdit,
      onDelete,
      onShare,
      ...props
    },
    ref
  ) => {
    const IconComp = getCollectionIconComponent(icon);

    return (
      <div
        ref={ref}
        onClick={() => onSelect?.(id)}
        className={cn(
          'group relative flex cursor-pointer items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-card-foreground shadow-sm transition-all hover:border-border hover:shadow-md active:scale-[0.99]',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          {/* Collection Icon Badge */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm text-white transition-transform group-hover:scale-105"
            style={{ backgroundColor: color }}
          >
            <IconComp className="h-5 w-5" />
          </div>

          <div className="flex flex-col">
            <h4 className="text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
              {name}
            </h4>
            {description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
            <span className="mt-1 text-[11px] font-medium text-muted-foreground">
              {placesCount} place{placesCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Action Dropdown Menu */}
        {(onEdit || onDelete || onShare) && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Collection options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)} className="gap-2">
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={() => onShare(id)} className="gap-2">
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }
);
CollectionCard.displayName = 'CollectionCard';

export interface CollectionFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  initialData?: Partial<CollectionFormData>;
  onSave: (data: CollectionFormData) => void;
  isSubmitting?: boolean;
}

export function CollectionDialog({
  open,
  onOpenChange,
  title = 'Create Collection',
  initialData,
  onSave,
  isSubmitting = false,
}: CollectionDialogProps) {
  const [name, setName] = React.useState(initialData?.name || '');
  const [description, setDescription] = React.useState(initialData?.description || '');
  const [color, setColor] = React.useState(initialData?.color || '#3b82f6');
  const [icon, setIcon] = React.useState(initialData?.icon || 'folder');

  React.useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setColor(initialData?.color || '#3b82f6');
      setIcon(initialData?.icon || 'folder');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), color, icon });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Organize your favorite pins, landmarks, and routes into a custom collection.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="col-name" className="text-xs font-semibold text-foreground">
                Collection Name *
              </label>
              <Input
                id="col-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Favorite Cafes, Weekend Hike"
                required
                autoFocus
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <label htmlFor="col-desc" className="text-xs font-semibold text-foreground">
                Description (optional)
              </label>
              <Input
                id="col-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes or tags..."
              />
            </div>

            {/* Color Swatches */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Badge Color
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLLECTION_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={cn(
                      'h-7 w-7 rounded-full transition-transform hover:scale-110 active:scale-95 shadow-sm',
                      color === c.value ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                    )}
                    aria-label={`Select ${c.name} color`}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Icon
              </label>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {COLLECTION_ICONS.map((i) => {
                  const Icon = i.icon;
                  const isSelected = icon === i.id;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setIcon(i.id)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all hover:bg-accent active:scale-95',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                          : 'border-border/60 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{i.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
