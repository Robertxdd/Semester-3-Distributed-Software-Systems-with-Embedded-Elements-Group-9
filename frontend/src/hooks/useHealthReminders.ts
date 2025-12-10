import { useEffect, useMemo, useRef } from 'react';
import type { ReminderSettings, UsageSummary } from '../types';
import { useNotifications } from '../context/NotificationContext';

interface Recommendation {
  title: string;
  body: string;
  severity: 'info' | 'warn' | 'good';
}

interface Props {
  usage?: UsageSummary | null;
  reminders?: ReminderSettings | null;
  deskName?: string;
}

export const useHealthReminders = ({ usage, reminders, deskName }: Props): Recommendation => {
  const { addToast } = useNotifications();
  const lastToastAt = useRef<number>(0);
  const lastImbalance = useRef<string | null>(null);

  const recommendation = useMemo<Recommendation>(() => {
    const sitting = usage?.sitting_minutes ?? 0;
    const standing = usage?.standing_minutes ?? 0;
    const total = sitting + standing;
    const standingShare = total ? Math.round((standing / total) * 100) : 0;

    if (!total) {
      return {
        title: 'Build a rhythm',
        body: 'No usage yet. Aim for a 40-60% standing share with short posture shifts each hour.',
        severity: 'info',
      };
    }

    if (standingShare < 40) {
      return {
        title: 'Too much sitting',
        body: 'Stand for 5-10 minutes now and try to keep standing near 40-60% of your day.',
        severity: 'warn',
      };
    }

    if (standingShare > 60) {
      return {
        title: 'Ease in some sitting',
        body: 'You are standing a lot. Sit briefly every hour to avoid fatigue and keep blood flowing.',
        severity: 'warn',
      };
    }

    if ((usage?.posture_changes ?? 0) < 5) {
      return {
        title: 'Add posture shifts',
        body: 'Great balance. Add a few more sit/stand changes to stay limber and boost circulation.',
        severity: 'info',
      };
    }

    return {
      title: 'Healthy balance',
      body: 'You are close to the 40-60% standing goal. Keep rotating every 45-60 minutes.',
      severity: 'good',
    };
  }, [usage]);

  useEffect(() => {
    if (!reminders?.enabled) return;
    const intervalMinutes =
      reminders.type === 'TIME'
        ? reminders.every_minutes || 45
        : Math.max(15, Math.min(120, (reminders.max_sitting_minutes || 90) / 2));
    const intervalMs = intervalMinutes * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastToastAt.current < intervalMs - 60 * 1000) {
        return;
      }

      if (reminders.type === 'TIME') {
        addToast(
          'Posture reminder',
          `Switch posture on ${deskName || 'this desk'} to keep a healthy sit/stand mix.`
        );
        lastToastAt.current = now;
        return;
      }

      const sitting = usage?.sitting_minutes ?? 0;
      const maxSit = reminders.max_sitting_minutes ?? 90;
      if (sitting >= maxSit) {
        addToast(
          'Time to stand',
          `You have been sitting for ${sitting} min. Stand for 5-10 min to rebalance.`
        );
        lastToastAt.current = now;
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [addToast, reminders, deskName, usage]);

  useEffect(() => {
    if (!reminders?.enabled) return;
    const sitting = usage?.sitting_minutes ?? 0;
    const standing = usage?.standing_minutes ?? 0;
    const total = sitting + standing;
    if (!total) return;

    const standingShare = Math.round((standing / total) * 100);
    const imbalance =
      standingShare < 35 ? 'mostly-sitting' : standingShare > 65 ? 'mostly-standing' : 'balanced';

    if (imbalance !== 'balanced' && imbalance !== lastImbalance.current) {
      addToast(
        'Rebalance posture',
        standingShare < 35
          ? 'You are mostly sitting. Stand for a bit to approach the 40-60% target.'
          : 'You are mostly standing. Sit briefly to keep a sustainable rhythm.'
      );
    }

    lastImbalance.current = imbalance;
  }, [addToast, reminders?.enabled, usage]);

  return recommendation;
};
