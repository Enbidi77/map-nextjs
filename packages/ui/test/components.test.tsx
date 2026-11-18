import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Button,
  Input,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Separator,
  FloatingMapControls,
  CollapsibleSidebar,
  SearchBar,
  LayerSelector,
  CoordinateBadge,
  PlaceCard,
  cn,
} from '../src/index.js';

describe('UI Primitives', () => {
  it('combines classes properly with cn utility', () => {
    expect(cn('px-2', 'py-1', { 'text-red-500': true, 'hidden': false })).toBe(
      'px-2 py-1 text-red-500'
    );
    // Overriding utility check
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('renders Button with variants and handles click', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="default" size="sm" onClick={handleClick}>
        Click Me
      </Button>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Input and handles input change', () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Enter place" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Enter place') as HTMLInputElement;
    expect(input).toBeDefined();
    fireEvent.change(input, { target: { value: 'San Francisco' } });
    expect(handleChange).toHaveBeenCalled();
    expect(input.value).toBe('San Francisco');
  });

  it('renders Card with header and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Map Info</CardTitle>
        </CardHeader>
        <CardContent>Content description</CardContent>
      </Card>
    );

    expect(screen.getByText('Map Info')).toBeDefined();
    expect(screen.getByText('Content description')).toBeDefined();
  });

  it('renders Badge with variants', () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toBeDefined();
  });

  it('renders Skeleton and Separator', () => {
    const { container } = render(
      <div>
        <Skeleton className="h-4 w-20" />
        <Separator orientation="horizontal" />
      </div>
    );
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });
});

describe('Map UI Wrappers', () => {
  it('renders FloatingMapControls and triggers callbacks', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onResetBearing = vi.fn();
    const onToggle3D = vi.fn();
    const onGeolocate = vi.fn();
    const onToggleFullscreen = vi.fn();
    const onToggleLayerMenu = vi.fn();

    render(
      <FloatingMapControls
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        bearing={45}
        onResetBearing={onResetBearing}
        is3D={false}
        onToggle3D={onToggle3D}
        onGeolocate={onGeolocate}
        isFullscreen={false}
        onToggleFullscreen={onToggleFullscreen}
        onToggleLayerMenu={onToggleLayerMenu}
      />
    );

    const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(zoomInBtn);
    expect(onZoomIn).toHaveBeenCalledTimes(1);

    const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
    fireEvent.click(zoomOutBtn);
    expect(onZoomOut).toHaveBeenCalledTimes(1);

    const compassBtn = screen.getByRole('button', { name: /reset bearing/i });
    fireEvent.click(compassBtn);
    expect(onResetBearing).toHaveBeenCalledTimes(1);

    const tiltBtn = screen.getByRole('button', { name: /switch to 3d perspective/i });
    fireEvent.click(tiltBtn);
    expect(onToggle3D).toHaveBeenCalledTimes(1);

    const locateBtn = screen.getByRole('button', { name: /find my location/i });
    fireEvent.click(locateBtn);
    expect(onGeolocate).toHaveBeenCalledTimes(1);

    const layerBtn = screen.getByRole('button', { name: /map layers & styles/i });
    fireEvent.click(layerBtn);
    expect(onToggleLayerMenu).toHaveBeenCalledTimes(1);

    const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i });
    fireEvent.click(fullscreenBtn);
    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('renders CollapsibleSidebar with header, body, and toggles collapse state', () => {
    const onOpenChange = vi.fn();
    render(
      <CollapsibleSidebar
        isOpen={true}
        onOpenChange={onOpenChange}
        header={<span>Sidebar Title</span>}
      >
        <p>Sidebar Body</p>
      </CollapsibleSidebar>
    );

    expect(screen.getByText('Sidebar Title')).toBeDefined();
    expect(screen.getByText('Sidebar Body')).toBeDefined();

    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(collapseBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders SearchBar, handles typing, clear button, and search on enter', () => {
    const onChange = vi.fn();
    const onSearch = vi.fn();
    const onClear = vi.fn();

    render(
      <SearchBar
        defaultValue="Golden Gate"
        onChange={onChange}
        onSearch={onSearch}
        onClear={onClear}
      />
    );

    const input = screen.getByDisplayValue('Golden Gate') as HTMLInputElement;
    expect(input).toBeDefined();

    // Clear button test
    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('');

    // Typing test
    fireEvent.change(input, { target: { value: 'Alcatraz' } });
    expect(onChange).toHaveBeenCalledWith('Alcatraz');

    // Enter key test
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('Alcatraz');
  });

  it('renders LayerSelector and allows selecting styles and toggling overlays', () => {
    const onSelectStyle = vi.fn();
    const onToggleOverlay = vi.fn();

    render(
      <LayerSelector
        activeStyleId="streets"
        onSelectStyle={onSelectStyle}
        overlays={[
          { id: '3d-buildings', name: '3D Buildings', visible: true, opacity: 0.8 },
          { id: 'traffic', name: 'Live Traffic', visible: false },
        ]}
        onToggleOverlay={onToggleOverlay}
      />
    );

    expect(screen.getByText('Streets')).toBeDefined();
    expect(screen.getByText('Satellite')).toBeDefined();

    // Click on satellite style
    const satelliteBtn = screen.getByRole('button', { name: /satellite/i });
    fireEvent.click(satelliteBtn);
    expect(onSelectStyle).toHaveBeenCalledWith('satellite');

    // Toggle 3D buildings overlay
    const hideBtn = screen.getByRole('button', { name: /hide layer/i });
    fireEvent.click(hideBtn);
    expect(onToggleOverlay).toHaveBeenCalledWith('3d-buildings', false);
  });

  it('renders CoordinateBadge with coordinates, zoom, and scale', () => {
    render(
      <CoordinateBadge
        latitude={37.7749}
        longitude={-122.4194}
        zoom={12.5}
        scaleText="500 m"
      />
    );

    expect(screen.getByText(/37.7749° N, 122.4194° W/i)).toBeDefined();
    expect(screen.getByText(/z: 12.5/i)).toBeDefined();
    expect(screen.getByText('500 m')).toBeDefined();
  });

  it('renders CoordinateBadge with DMS formatting', () => {
    render(
      <CoordinateBadge
        latitude={37.7749}
        longitude={-122.4194}
        format="dms"
      />
    );

    expect(screen.getByText(/37°46′29″N 122°25′9″W/i)).toBeDefined();
  });

  it('renders PlaceCard with details and triggers directions and save actions', () => {
    const onDirections = vi.fn();
    const onSave = vi.fn();

    render(
      <PlaceCard
        name="San Francisco Ferry Building"
        category="Landmark"
        address="1 Ferry Building, San Francisco, CA"
        rating={4.7}
        reviewsCount={15420}
        isOpenNow={true}
        onDirectionsClick={onDirections}
        onSaveClick={onSave}
      />
    );

    expect(screen.getByText('San Francisco Ferry Building')).toBeDefined();
    expect(screen.getByText('Landmark')).toBeDefined();
    expect(screen.getByText(/4.7/)).toBeDefined();
    expect(screen.getByText('Open')).toBeDefined();

    const dirBtn = screen.getByRole('button', { name: /directions/i });
    fireEvent.click(dirBtn);
    expect(onDirections).toHaveBeenCalledTimes(1);

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
