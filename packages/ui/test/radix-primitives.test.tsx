import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Toggle,
  Slider,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  ThemeToggle,
} from '../src/index.js';

describe('Radix Primitives & Overlays', () => {
  it('renders Dialog and opens on trigger click', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Header</DialogTitle>
          <DialogDescription>Dialog Details</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Open Dialog');
    fireEvent.click(trigger);
    expect(screen.getByText('Dialog Header')).toBeDefined();
    expect(screen.getByText('Dialog Details')).toBeDefined();
  });

  it('renders Sheet and opens content', () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <button>Open Sheet</button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>Mobile Map Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    );

    const trigger = screen.getByText('Open Sheet');
    fireEvent.click(trigger);
    expect(screen.getByText('Mobile Map Sheet')).toBeDefined();
  });

  it('renders Tabs and displays content', () => {
    render(
      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="directions">Directions</TabsTrigger>
        </TabsList>
        <TabsContent value="search">Search Tab Content</TabsContent>
        <TabsContent value="directions">Directions Tab Content</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Search Tab Content')).toBeDefined();
    const dirTrigger = screen.getByRole('tab', { name: /directions/i });
    expect(dirTrigger).toBeDefined();
  });

  it('renders Toggle and toggles pressed state', () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle aria-label="Toggle pin" onPressedChange={onPressedChange}>
        Pin
      </Toggle>
    );

    const toggle = screen.getByRole('button', { name: /toggle pin/i });
    fireEvent.click(toggle);
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('renders Slider and Tooltip', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip info</TooltipContent>
        </Tooltip>
        <Slider defaultValue={[50]} max={100} step={1} aria-label="Opacity" />
      </TooltipProvider>
    );

    expect(screen.getByText('Hover me')).toBeDefined();
    expect(screen.getByRole('slider')).toBeDefined();
  });

  it('renders DropdownMenu trigger', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Options</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Option 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByRole('button', { name: /options/i });
    expect(trigger).toBeDefined();
  });

  it('renders ThemeToggle in fallback/mounted mode', () => {
    render(<ThemeToggle variant="toggle" />);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });
});
