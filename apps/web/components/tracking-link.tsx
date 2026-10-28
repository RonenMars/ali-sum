import { ExternalLink } from "lucide-react";

export function TrackingLink({ trackingNumber }: { trackingNumber: string }) {
  const number = trackingNumber.trim();
  if (!number) return null;

  return (
    <a
      href={`https://parcelsapp.com/en/tracking/${encodeURIComponent(number)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex w-full items-center justify-center gap-2 text-xs font-bold text-primary"
    >
      Track package on ParcelsApp
      <ExternalLink aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}
