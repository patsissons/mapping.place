import { createId } from "@/lib/utils";
import { type OpeningHours, type Place, type PlaceDraft } from "@/lib/types";

export const DAY_LABELS = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
} as const;

export function createDefaultHours(): OpeningHours {
  return {
    sunday: { enabled: false, open: "09:00", close: "17:00" },
    monday: { enabled: true, open: "09:00", close: "17:00" },
    tuesday: { enabled: true, open: "09:00", close: "17:00" },
    wednesday: { enabled: true, open: "09:00", close: "17:00" },
    thursday: { enabled: true, open: "09:00", close: "17:00" },
    friday: { enabled: true, open: "09:00", close: "18:00" },
    saturday: { enabled: true, open: "09:00", close: "18:00" },
  };
}

export function createBlankPlaceDraft(): PlaceDraft {
  return {
    name: "",
    placeId: "",
    address: "",
    notes: "",
    lat: "",
    lng: "",
    rating: "4.2",
    reviewCount: "120",
    hours: createDefaultHours(),
  };
}

export function createStarterPlaces(): Place[] {
  return [
    {
      id: createId("place"),
      placeId: "sample-1",
      name: "Blue Bottle Coffee Hayes Valley",
      address: "315 Linden St, San Francisco, CA",
      notes: "Consistent espresso stop near the park.",
      lat: 37.77659,
      lng: -122.42418,
      rating: 4.6,
      reviewCount: 913,
      hours: {
        ...createDefaultHours(),
        saturday: { enabled: true, open: "08:00", close: "18:00" },
        sunday: { enabled: true, open: "08:00", close: "17:00" },
      },
    },
    {
      id: createId("place"),
      placeId: "sample-2",
      name: "The Mill",
      address: "736 Divisadero St, San Francisco, CA",
      notes: "Bread, coffee, and a strong review count baseline.",
      lat: 37.77636,
      lng: -122.437,
      rating: 4.5,
      reviewCount: 2431,
      hours: {
        ...createDefaultHours(),
        saturday: { enabled: true, open: "08:00", close: "16:00" },
        sunday: { enabled: true, open: "08:00", close: "16:00" },
      },
    },
    {
      id: createId("place"),
      placeId: "sample-3",
      name: "Birite Market",
      address: "3639 18th St, San Francisco, CA",
      notes: "Grocery anchor for the neighborhood walk.",
      lat: 37.7606,
      lng: -122.4353,
      rating: 4.8,
      reviewCount: 1587,
      hours: {
        ...createDefaultHours(),
        sunday: { enabled: true, open: "08:00", close: "21:00" },
      },
    },
  ];
}
