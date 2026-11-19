'use client';

import * as React from 'react';
import {
  Bell,
  MessageSquare,
  AtSign,
  Bookmark,
  AlertCircle,
  CheckCheck,
} from 'lucide-react';
import { GlassCard } from '@modern-maps/ui';

export interface NotificationItem {
  id: string;
  type: 'mention' | 'message' | 'saved' | 'system';
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  avatar?: string;
  senderName?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'mention',
    title: 'Mentioned in Embarcadero Route',
    description: '@sarah commented: "Let\'s add the Ferry Building farmers market stop here!"',
    timestamp: '5m ago',
    unread: true,
    senderName: 'Sarah Chen',
  },
  {
    id: 'notif-2',
    type: 'message',
    title: 'New collaborative waypoint',
    description: 'Alex Rivera added 3 new photo vantage points to Presidio Coastal Trail.',
    timestamp: '28m ago',
    unread: true,
    senderName: 'Alex Rivera',
  },
  {
    id: 'notif-3',
    type: 'saved',
    title: 'Saved place update',
    description: 'Japanese Tea Garden operating hours updated: open until 6:00 PM today.',
    timestamp: '2h ago',
    unread: true,
  },
  {
    id: 'notif-4',
    type: 'system',
    title: 'Traffic & Transit Advisory',
    description: 'Light evening congestion near Bay Bridge approach. Alternate ferry routes active.',
    timestamp: '1d ago',
    unread: false,
  },
];

export interface NotificationsPanelProps {
  className?: string;
  onNotificationClick?: (notif: NotificationItem) => void;
}

export function NotificationsPanel({
  className = '',
  onNotificationClick,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => n.unread) : notifications;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'mention':
        return <AtSign className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case 'saved':
        return <Bookmark className="h-4 w-4 text-amber-500" />;
      case 'system':
      default:
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <GlassCard radius="3xl" className={`p-5 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">Team activity & real-time alerts</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 pt-3 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1 font-medium transition-all ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-white/40 dark:bg-zinc-800/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`rounded-full px-3 py-1 font-medium transition-all ${
            filter === 'unread'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-white/40 dark:bg-zinc-800/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-white/10 dark:divide-white/5 space-y-1">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No notifications in this view.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                markOneRead(item.id);
                onNotificationClick?.(item);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  markOneRead(item.id);
                  onNotificationClick?.(item);
                }
              }}
              className={`flex items-start gap-3 py-3 px-2 rounded-xl transition-all cursor-pointer hover:bg-white/40 dark:hover:bg-zinc-800/40 ${
                item.unread ? 'bg-white/20 dark:bg-white/5' : ''
              }`}
            >
              {/* Icon / Avatar pill */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-zinc-800/60 border border-white/30 dark:border-white/10 shadow-sm mt-0.5">
                {getIcon(item.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                    {item.title}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Unread indicator dot */}
              {item.unread && (
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
