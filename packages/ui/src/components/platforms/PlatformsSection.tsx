import type { PlatformCode } from "@opensellvy/types";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

export type PlatformStatus = "ready" | "soon";

export interface PlatformMeta {
  code: PlatformCode;
  name: string;
  status: PlatformStatus;
  description: string;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    code: "shopee",
    name: "Shopee",
    status: "ready",
    description: "Adapter rujukan nyata — full Open Platform v2.",
  },
  {
    code: "tts-tokopedia",
    name: "TikTok Shop / Tokopedia",
    status: "ready",
    description: "Adapter dari SDK user, OAuth flow terbaru, live-verify sandbox.",
  },
  {
    code: "lazada",
    name: "Lazada",
    status: "soon",
    description: "Segera hadir.",
  },
  {
    code: "blibli",
    name: "Blibli",
    status: "soon",
    description: "Segera hadir.",
  },
  {
    code: "local",
    name: "Lokal",
    status: "ready",
    description: "Adapter in-memory bukti satu-gate.",
  },
];

export interface PlatformsSectionProps {
  className?: string;
}

export function PlatformsSection({ className }: PlatformsSectionProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {PLATFORMS.map((platform) => (
        <PlatformCard key={platform.code} platform={platform} />
      ))}
    </div>
  );
}

interface PlatformCardProps {
  platform: PlatformMeta;
}

function PlatformCard({ platform }: PlatformCardProps) {
  const isSoon = platform.status === "soon";
  return (
    <Card
      className={cn(
        "transition-colors",
        isSoon && "border-dashed opacity-70",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
        <CardTitle className="text-lg">{platform.name}</CardTitle>
        <Badge variant={isSoon ? "secondary" : "default"}>
          {isSoon ? "Soon" : "Ready"}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{platform.description}</p>
      </CardContent>
    </Card>
  );
}