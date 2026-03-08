import { Activity, MapPinned, MessageSquareText, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type SummaryStripProps = {
  placeCount: number;
  openCount: number;
  averageRating: number;
  totalReviews: number;
};

const items = [
  {
    key: "placeCount",
    label: "Places",
    icon: MapPinned,
  },
  {
    key: "openCount",
    label: "Open on date",
    icon: Activity,
  },
  {
    key: "averageRating",
    label: "Average rating",
    icon: Star,
  },
  {
    key: "totalReviews",
    label: "Total reviews",
    icon: MessageSquareText,
  },
] as const;

export function SummaryStrip({
  placeCount,
  openCount,
  averageRating,
  totalReviews,
}: SummaryStripProps) {
  const values = {
    placeCount: `${placeCount}`,
    openCount: `${openCount}`,
    averageRating: averageRating.toFixed(1),
    totalReviews: totalReviews.toLocaleString(),
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.key} className="border-border/60">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-primary/12 rounded-md p-3 text-primary">
                <Icon className="size-4" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </div>
                <div className="mt-1 text-xl font-semibold">
                  {values[item.key]}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
