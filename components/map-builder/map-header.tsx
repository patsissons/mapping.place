"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Copy,
  Link2,
  Plus,
  SquareStack,
} from "lucide-react";

import { ThemeToggle } from "@/components/map-builder/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HoverPopover } from "@/components/ui/hover-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MapHeaderProps = {
  mapName: string;
  mapEmoji: string;
  selectedDate: string;
  permalink: string;
  copyState: "idle" | "copied" | "error";
  savedMapCount: number;
  isExpanded: boolean;
  onMapNameChange: (value: string) => void;
  onMapEmojiChange: (value: string) => void;
  onMapNameBlur: () => void;
  onSelectedDateChange: (value: string) => void;
  onCopyPermalink: () => void;
  onNewMap: () => void;
  onExpandedChange: (isExpanded: boolean) => void;
};

export function MapHeader({
  mapName,
  mapEmoji,
  selectedDate,
  permalink,
  copyState,
  savedMapCount,
  isExpanded,
  onMapNameChange,
  onMapEmojiChange,
  onMapNameBlur,
  onSelectedDateChange,
  onCopyPermalink,
  onNewMap,
  onExpandedChange,
}: MapHeaderProps) {
  const copyButton = (
    <Button variant="outline" onClick={onCopyPermalink}>
      <Copy className="size-4" />
      {copyState === "copied"
        ? "Copied"
        : copyState === "error"
          ? "Copy failed"
          : "Copy link"}
    </Button>
  );

  return (
    <Card className="overflow-hidden border-border/60">
      <CardHeader
        className={cn(
          "flex flex-col gap-4 bg-card/80 md:flex-row md:items-center md:justify-between",
          isExpanded ? "border-b border-border/60 pb-4" : "pb-5",
        )}
      >
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground no-underline"
        >
          mapping.place
        </Link>
        <div className="flex flex-wrap items-center gap-2 self-start">
          {!isExpanded ? copyButton : null}
          <Button variant="secondary" onClick={onNewMap}>
            <Plus className="size-4" />
            New map
          </Button>
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse top bar" : "Expand top bar"}
            onClick={() => onExpandedChange(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded ? (
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[minmax(0,1fr)_7rem_14rem_11rem]">
          <div className="space-y-2">
            <Label htmlFor="map-name">Map name</Label>
            <Input
              id="map-name"
              value={mapName}
              onBlur={onMapNameBlur}
              onChange={(event) => onMapNameChange(event.target.value)}
              placeholder="Weekend coffee crawl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="map-emoji">Emoji</Label>
            <Input
              id="map-emoji"
              value={mapEmoji}
              onChange={(event) => onMapEmojiChange(event.target.value)}
              placeholder="🌴"
              maxLength={8}
            />
          </div>
          <div className="space-y-2">
            <div className="flex min-h-6 items-center gap-2">
              <Label htmlFor="selected-date">Status date</Label>
              <HoverPopover
                content="This date controls the open or closed status shown for each place, the open-count stat, and the open-only filter."
                align="left"
              >
                <CircleHelp className="size-3.5" />
              </HoverPopover>
            </div>
            <Input
              id="selected-date"
              type="date"
              value={selectedDate}
              onChange={(event) => onSelectedDateChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Saved maps</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-secondary/40 px-3 text-sm">
              <HoverPopover
                content="Saved maps are stored locally in this browser on this device."
                align="right"
              >
                <SquareStack className="size-4 text-primary" />
              </HoverPopover>
              <span className="font-semibold text-foreground">
                {savedMapCount}
              </span>
            </div>
          </div>
          <div className="space-y-2 md:col-span-4">
            <Label htmlFor="permalink">Shareable permalink</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="permalink"
                  value={permalink}
                  readOnly
                  className="pl-9 pr-4 text-xs sm:text-sm"
                />
              </div>
              {copyButton}
            </div>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
