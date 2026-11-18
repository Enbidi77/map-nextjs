import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MeasurementDrawingToolbar,
  ManeuverInstructionCard,
  getManeuverIcon,
  CollectionCard,
  CollectionDialog,
} from '../src/index.js';

describe('Phase 3-6 UI Additions', () => {
  describe('MeasurementDrawingToolbar', () => {
    it('renders toolbar and toggles measurement and drawing modes', () => {
      const onModeChange = vi.fn();
      const onClear = vi.fn();
      const onFinish = vi.fn();

      const { rerender } = render(
        <MeasurementDrawingToolbar
          activeMode="none"
          onModeChange={onModeChange}
          onClear={onClear}
          onFinish={onFinish}
        />
      );

      const distanceBtn = screen.getByRole('button', { name: /measure distance/i });
      fireEvent.click(distanceBtn);
      expect(onModeChange).toHaveBeenCalledWith('distance');

      const polygonBtn = screen.getByRole('button', { name: /draw polygon/i });
      fireEvent.click(polygonBtn);
      expect(onModeChange).toHaveBeenCalledWith('polygon');

      // Re-render in active distance mode with measurement value
      rerender(
        <MeasurementDrawingToolbar
          activeMode="distance"
          onModeChange={onModeChange}
          onClear={onClear}
          onFinish={onFinish}
          canFinish={true}
          canClear={true}
          measurementValue="1.45"
          measurementUnit="km"
        />
      );

      expect(screen.getByText(/1.45 km/i)).toBeDefined();

      const finishBtn = screen.getByRole('button', { name: /finish drawing/i });
      fireEvent.click(finishBtn);
      expect(onFinish).toHaveBeenCalledTimes(1);

      const clearBtn = screen.getByRole('button', { name: /clear points/i });
      fireEvent.click(clearBtn);
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('ManeuverInstructionCard', () => {
    it('renders maneuver instruction, distance, duration, and icon', () => {
      render(
        <ManeuverInstructionCard
          type="turn"
          modifier="right"
          instruction="Turn right onto Market St"
          streetName="Market Street"
          distance={450}
          duration={120}
          stepNumber={2}
          totalSteps={6}
          isCurrent={true}
        />
      );

      expect(screen.getByText('Turn right onto Market St')).toBeDefined();
      expect(screen.getByText('Market Street')).toBeDefined();
      expect(screen.getByText('450 m')).toBeDefined();
      expect(screen.getByText('2 min')).toBeDefined();
      expect(screen.getByText(/step 2 of 6/i)).toBeDefined();
      expect(screen.getByText(/current/i)).toBeDefined();
    });

    it('renders compact mode maneuver item', () => {
      render(
        <ManeuverInstructionCard
          type="arrive"
          instruction="Arrive at destination"
          distance={1200}
          compact={true}
        />
      );

      expect(screen.getByText('Arrive at destination')).toBeDefined();
      expect(screen.getByText('1.2 km')).toBeDefined();
    });

    it('resolves different icons for maneuvers', () => {
      expect(getManeuverIcon('arrive')).toBeDefined();
      expect(getManeuverIcon('depart')).toBeDefined();
      expect(getManeuverIcon('roundabout')).toBeDefined();
      expect(getManeuverIcon('merge')).toBeDefined();
      expect(getManeuverIcon('turn', 'uturn')).toBeDefined();
      expect(getManeuverIcon('turn', 'left')).toBeDefined();
      expect(getManeuverIcon('turn', 'slight-right')).toBeDefined();
    });
  });

  describe('CollectionCard and CollectionDialog', () => {
    it('renders CollectionCard and responds to selection and actions', () => {
      const onSelect = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <CollectionCard
          id="col-1"
          name="Weekend Hikes"
          description="Scenic trails around the Bay"
          placesCount={8}
          color="#10b981"
          icon="camera"
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      expect(screen.getByText('Weekend Hikes')).toBeDefined();
      expect(screen.getByText('Scenic trails around the Bay')).toBeDefined();
      expect(screen.getByText('8 places')).toBeDefined();

      const card = screen.getByText('Weekend Hikes');
      fireEvent.click(card);
      expect(onSelect).toHaveBeenCalledWith('col-1');
    });

    it('renders CollectionDialog and submits new collection data', () => {
      const onSave = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <CollectionDialog
          open={true}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      );

      expect(screen.getByText('Create Collection')).toBeDefined();

      const nameInput = screen.getByLabelText(/collection name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Best Coffee' } });

      const submitBtn = screen.getByRole('button', { name: /save collection/i });
      fireEvent.click(submitBtn);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Best Coffee',
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
