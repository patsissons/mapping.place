"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Link2,
  MapPinned,
  Plus,
} from "lucide-react";

import { ThemeToggle } from "@/components/map-builder/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MapHeaderProps = {
  mapName: string;
  mapEmoji: string;
  permalink: string;
  copyState: "idle" | "copied" | "error";
  isExpanded: boolean;
  authControls?: ReactNode;
  onMapNameChange: (value: string) => void;
  onMapEmojiChange: (value: string) => void;
  onMapNameBlur: () => void;
  onCopyPermalink: () => void;
  onImportGoogleList: () => void;
  onNewMap: () => void;
  onExpandedChange: (isExpanded: boolean) => void;
};

export function MapHeader({
  mapName,
  mapEmoji,
  permalink,
  copyState,
  isExpanded,
  authControls,
  onMapNameChange,
  onMapEmojiChange,
  onMapNameBlur,
  onCopyPermalink,
  onImportGoogleList,
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
          <Button onClick={onImportGoogleList}>
            <MapPinned className="size-4" />
            Import list
          </Button>
          <Button variant="secondary" onClick={onNewMap}>
            <Plus className="size-4" />
            New map
          </Button>
          <ThemeToggle />
          {authControls}
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
        <CardContent className="grid gap-4 pt-5">
          <div className="space-y-2">
            <Label htmlFor="map-name">Map name</Label>
            <div className="flex gap-2">
              <div className="w-16 shrink-0">
                <Label htmlFor="map-emoji" className="sr-only">
                  Emoji
                </Label>
                <Input
                  id="map-emoji"
                  value={mapEmoji}
                  onChange={(event) => onMapEmojiChange(event.target.value)}
                  maxLength={8}
                  className="text-center"
                />
              </div>
              <Input
                id="map-name"
                value={mapName}
                onBlur={onMapNameBlur}
                onChange={(event) => onMapNameChange(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
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
