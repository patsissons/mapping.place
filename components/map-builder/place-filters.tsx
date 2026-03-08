import { CircleHelp, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HoverPopover } from "@/components/ui/hover-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type PinMode, type SortOption } from "@/lib/types";

type PlaceFiltersProps = {
  filterText: string;
  openOnly: boolean;
  pinMode: PinMode;
  sortOption: SortOption;
  selectedDate: string;
  onFilterTextChange: (value: string) => void;
  onOpenOnlyChange: (value: boolean) => void;
  onPinModeChange: (value: PinMode) => void;
  onSortOptionChange: (value: SortOption) => void;
  onSelectedDateChange: (value: string) => void;
};

const pinModes: { value: PinMode; label: string }[] = [
  { value: "rating", label: "Rating" },
  { value: "reviews", label: "Reviews" },
  { value: "status", label: "Open / closed" },
];

export function PlaceFilters({
  filterText,
  openOnly,
  pinMode,
  sortOption,
  selectedDate,
  onFilterTextChange,
  onOpenOnlyChange,
  onPinModeChange,
  onSortOptionChange,
  onSelectedDateChange,
}: PlaceFiltersProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="size-4 text-primary" />
          Filters and pin styling
        </CardTitle>
        <CardDescription>
          Search, filter by open status on {selectedDate}, and switch the marker
          encoding mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="filter-text">Find places</Label>
          <Input
            id="filter-text"
            value={filterText}
            onChange={(event) => onFilterTextChange(event.target.value)}
            placeholder="Coffee, museum, bookstore..."
          />
        </div>
        <div className="space-y-2">
          <div className="flex min-h-6 items-center gap-2">
            <Label htmlFor="selected-date-filter">Status date</Label>
            <HoverPopover
              content="This date controls the open or closed status shown for each place, the open-count stat, and the open-only filter."
              align="left"
            >
              <CircleHelp className="size-3.5" />
            </HoverPopover>
          </div>
          <Input
            id="selected-date-filter"
            type="date"
            value={selectedDate}
            onChange={(event) => onSelectedDateChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort-option">Sort by</Label>
          <select
            id="sort-option"
            value={sortOption}
            onChange={(event) =>
              onSortOptionChange(event.target.value as SortOption)
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="rating:desc">Rating: high to low</option>
            <option value="rating:asc">Rating: low to high</option>
            <option value="reviews:desc">Reviews: high to low</option>
            <option value="reviews:asc">Reviews: low to high</option>
            <option value="name:asc">Name: A to Z</option>
            <option value="name:desc">Name: Z to A</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => onOpenOnlyChange(!openOnly)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
            openOnly
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          <div>
            <div className="font-medium text-foreground">Open only</div>
            <div className="text-xs">
              Only show places that are open on the selected date.
            </div>
          </div>
          <div
            className={cn(
              "rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
              openOnly ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            {openOnly ? "On" : "Off"}
          </div>
        </button>
        <div className="space-y-2">
          <Label>Map pins encode</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {pinModes.map((mode) => (
              <Button
                key={mode.value}
                type="button"
                variant={pinMode === mode.value ? "default" : "outline"}
                className="justify-center"
                onClick={() => onPinModeChange(mode.value)}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
