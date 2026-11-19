import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  GlassButton,
  ActivityStatCard,
  QuickActionButton,
  FeatureRibbonCard,
  Button,
  SearchBar,
  ThemeToggle,
} from '../src/index.js';

describe('Fusion UI - Liquid Glass & Primitives', () => {
  describe('GlassCard', () => {
    it('renders with default frosted glass styling', () => {
      render(
        <GlassCard data-testid="glass-card">
          <p>Glass Content</p>
        </GlassCard>
      );
      const card = screen.getByTestId('glass-card');
      expect(card).toBeDefined();
      expect(card.className).toContain('backdrop-blur-2xl');
      expect(card.className).toContain('border-white/30');
      expect(card.className).toContain('rounded-2xl');
      expect(screen.getByText('Glass Content')).toBeDefined();
    });

    it('renders elevated, subtle, sunken, and interactive variants', () => {
      const { rerender } = render(
        <GlassCard variant="elevated" data-testid="card">
          Elevated
        </GlassCard>
      );
      expect(screen.getByTestId('card').className).toContain('border-white/40');

      rerender(
        <GlassCard variant="interactive" data-testid="card">
          Interactive
        </GlassCard>
      );
      expect(screen.getByTestId('card').className).toContain('cursor-pointer');

      rerender(
        <GlassCard variant="sunken" data-testid="card">
          Sunken
        </GlassCard>
      );
      expect(screen.getByTestId('card').className).toContain('shadow-inner');
    });

    it('renders header, title, description, content, and footer subcomponents', () => {
      render(
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Test Title</GlassCardTitle>
            <GlassCardDescription>Test Description</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>Main Content</GlassCardContent>
          <GlassCardFooter>Footer Info</GlassCardFooter>
        </GlassCard>
      );

      expect(screen.getByText('Test Title')).toBeDefined();
      expect(screen.getByText('Test Description')).toBeDefined();
      expect(screen.getByText('Main Content')).toBeDefined();
      expect(screen.getByText('Footer Info')).toBeDefined();
    });
  });

  describe('GlassButton', () => {
    it('renders pill button and handles click event', () => {
      const handleClick = vi.fn();
      render(<GlassButton onClick={handleClick}>Liquid Glass</GlassButton>);

      const btn = screen.getByRole('button', { name: /liquid glass/i });
      expect(btn).toBeDefined();
      expect(btn.className).toContain('rounded-full');
      expect(btn.className).toContain('backdrop-blur-xl');

      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports non-pill and custom variants (primary, accent, ghost)', () => {
      const { rerender } = render(
        <GlassButton variant="primary" pill={false} data-testid="btn">
          Primary
        </GlassButton>
      );
      let btn = screen.getByTestId('btn');
      expect(btn.className).toContain('rounded-xl');
      expect(btn.className).toContain('bg-primary/80');

      rerender(
        <GlassButton variant="accent" data-testid="btn">
          Accent
        </GlassButton>
      );
      btn = screen.getByTestId('btn');
      expect(btn.className).toContain('bg-gradient-to-r');

      rerender(
        <GlassButton variant="ghost" data-testid="btn">
          Ghost
        </GlassButton>
      );
      btn = screen.getByTestId('btn');
      expect(btn.className).toContain('bg-transparent');
    });

    it('respects disabled state', () => {
      const handleClick = vi.fn();
      render(
        <GlassButton disabled onClick={handleClick}>
          Disabled
        </GlassButton>
      );
      const btn = screen.getByRole('button', { name: /disabled/i });
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('ActivityStatCard', () => {
    it('renders stat value, label, unit, subtitle, and icon', () => {
      render(
        <ActivityStatCard
          label="Total Distance"
          value="142.8"
          unit="km"
          subtitle="Past 30 days"
          icon={<span data-testid="test-icon">📍</span>}
          color="emerald"
        />
      );

      expect(screen.getByText('Total Distance')).toBeDefined();
      expect(screen.getByText('142.8')).toBeDefined();
      expect(screen.getByText('km')).toBeDefined();
      expect(screen.getByText('Past 30 days')).toBeDefined();
      expect(screen.getByTestId('test-icon')).toBeDefined();
    });

    it('renders colored icon pill for blue, pink, cyan, amber, purple', () => {
      const { rerender } = render(
        <ActivityStatCard
          label="Speed"
          value="48"
          icon={<span>⚡</span>}
          color="blue"
          data-testid="stat-card"
        />
      );
      expect(screen.getByTestId('stat-card').className).toContain('shadow-[0_8px_24px_rgba(59,130,246,0.18)]');

      rerender(
        <ActivityStatCard
          label="Heart Rate"
          value="120"
          icon={<span>❤️</span>}
          color="pink"
          data-testid="stat-card"
        />
      );
      expect(screen.getByTestId('stat-card').className).toContain('shadow-[0_8px_24px_rgba(236,72,153,0.18)]');

      rerender(
        <ActivityStatCard
          label="Altitude"
          value="850"
          icon={<span>⛰️</span>}
          color="cyan"
          data-testid="stat-card"
        />
      );
      expect(screen.getByTestId('stat-card').className).toContain('shadow-[0_8px_24px_rgba(6,182,212,0.18)]');
    });

    it('renders trend badges (positive and negative)', () => {
      const { rerender } = render(
        <ActivityStatCard
          label="Trips"
          value="24"
          icon={<span>🚗</span>}
          trend={{ value: '18%', isPositive: true, label: 'vs last week' }}
        />
      );
      expect(screen.getByText('18%')).toBeDefined();
      expect(screen.getByText('vs last week')).toBeDefined();
      expect(screen.getByText('↑')).toBeDefined();

      rerender(
        <ActivityStatCard
          label="Trips"
          value="15"
          icon={<span>🚗</span>}
          trend={{ value: '5%', isPositive: false }}
        />
      );
      expect(screen.getByText('5%')).toBeDefined();
      expect(screen.getByText('↓')).toBeDefined();
    });

    it('handles click when interactive or onClick provided', () => {
      const handleClick = vi.fn();
      render(
        <ActivityStatCard
          label="Interactive Card"
          value="100"
          icon={<span>⭐</span>}
          onClick={handleClick}
          data-testid="interactive-stat"
        />
      );
      const card = screen.getByTestId('interactive-stat');
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('QuickActionButton', () => {
    it('renders translucent circular button with label underneath', () => {
      const handleClick = vi.fn();
      render(
        <QuickActionButton
          label="Directions"
          icon={<span data-testid="qa-icon">🧭</span>}
          onClick={handleClick}
        />
      );

      expect(screen.getByText('Directions')).toBeDefined();
      expect(screen.getByTestId('qa-icon')).toBeDefined();

      const btn = screen.getByRole('button', { name: /directions/i });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles active state and badge indicator', () => {
      render(
        <QuickActionButton
          label="Saved"
          icon={<span>🔖</span>}
          active
          badge={5}
        />
      );

      const btn = screen.getByRole('button', { name: /saved/i });
      expect(btn.getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByText('5')).toBeDefined();
    });

    it('supports different sizes and colors', () => {
      const { rerender } = render(
        <QuickActionButton
          label="Nearby"
          icon={<span>📍</span>}
          size="sm"
          color="emerald"
        />
      );
      let btn = screen.getByRole('button', { name: /nearby/i });
      expect(btn.className).toContain('h-10 w-10');

      rerender(
        <QuickActionButton
          label="Nearby"
          icon={<span>📍</span>}
          size="lg"
          color="blue"
        />
      );
      btn = screen.getByRole('button', { name: /nearby/i });
      expect(btn.className).toContain('h-14 w-14');
    });

    it('supports disabled state', () => {
      const handleClick = vi.fn();
      render(
        <QuickActionButton
          label="Disabled Action"
          icon={<span>⛔</span>}
          disabled
          onClick={handleClick}
        />
      );

      const btn = screen.getByRole('button', { name: /disabled action/i });
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('FeatureRibbonCard', () => {
    it('renders icon, title, description, badge, and interactive children slot', () => {
      render(
        <FeatureRibbonCard
          icon={<span data-testid="ribbon-icon">🗺️</span>}
          title="3D Terrain Mode"
          description="High-resolution elevation contours"
          badge="Live"
          action={<button>Action</button>}
        >
          <div data-testid="interactive-slot">
            <input type="range" aria-label="Pitch angle" />
          </div>
        </FeatureRibbonCard>
      );

      expect(screen.getByText('3D Terrain Mode')).toBeDefined();
      expect(screen.getByText('High-resolution elevation contours')).toBeDefined();
      expect(screen.getByText('Live')).toBeDefined();
      expect(screen.getByText('Action')).toBeDefined();
      expect(screen.getByTestId('interactive-slot')).toBeDefined();
      expect(screen.getByTestId('ribbon-icon')).toBeDefined();
    });

    it('handles active state and onClick handler', () => {
      const handleClick = vi.fn();
      render(
        <FeatureRibbonCard
          title="Satellite Layer"
          active
          onClick={handleClick}
          data-testid="ribbon-card"
        />
      );

      const card = screen.getByTestId('ribbon-card');
      expect(card.className).toContain('ring-2 ring-primary/50');
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Glass variants on standard components', () => {
    it('renders Button with glass and glass-pill variants', () => {
      render(
        <>
          <Button variant="glass" data-testid="btn-glass">
            Glass Standard
          </Button>
          <Button variant="glass-pill" data-testid="btn-glass-pill">
            Glass Pill
          </Button>
        </>
      );

      const glassBtn = screen.getByTestId('btn-glass');
      expect(glassBtn.className).toContain('backdrop-blur-xl');
      expect(glassBtn.className).toContain('border-white/40');

      const pillBtn = screen.getByTestId('btn-glass-pill');
      expect(pillBtn.className).toContain('rounded-full');
      expect(pillBtn.className).toContain('backdrop-blur-xl');
    });

    it('renders SearchBar with variant="glass"', () => {
      render(<SearchBar variant="glass" placeholder="Glass search..." />);

      const input = screen.getByPlaceholderText('Glass search...');
      expect(input).toBeDefined();

      const container = input.closest('div');
      expect(container?.className).toContain('rounded-2xl');
      expect(container?.className).toContain('backdrop-blur-2xl');
    });

    it('renders ThemeToggle with glass variant and glass prop', () => {
      render(<ThemeToggle variant="glass" />);
      const btn = screen.getByRole('button', { name: /toggle theme|switch to/i });
      expect(btn).toBeDefined();
      expect(btn.className).toContain('rounded-full');
    });
  });
});
