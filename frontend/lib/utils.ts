import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case 'critical':
      return '#ef4444'; // red-500
    case 'high':
      return '#f97316'; // orange-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'low':
      return '#22c55e'; // green-500
    default:
      return '#6b7280'; // gray-500
  }
}

export function getRiskBgColor(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/20';
    case 'high':
      return 'bg-orange-500/10 border-orange-500/20';
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/20';
    case 'low':
      return 'bg-green-500/10 border-green-500/20';
    default:
      return 'bg-gray-500/10 border-gray-500/20';
  }
}

export function formatNumber(num: number): string {
  if (num === undefined || num === null || Number.isNaN(num)) return '0';
  if (!Number.isFinite(num)) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.round(num).toString();
}

export function formatPercentage(num: number): string {
  if (num === undefined || num === null || Number.isNaN(num)) return '0%';
  if (!Number.isFinite(num)) return '0%';
  return Math.min(100, Math.max(0, num * 100)).toFixed(0) + '%';
}

// Made with Bob
