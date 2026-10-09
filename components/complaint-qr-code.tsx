'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, Copy, Check, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ComplaintQrCodeProps {
  ticketId: string;
  title?: string;
  department?: string;
  status?: string;
  priority?: string;
  size?: number;
  showCard?: boolean;
}

export function ComplaintQrCode({
  ticketId,
  title,
  department,
  status,
  priority,
  size = 160,
  showCard = true,
}: ComplaintQrCodeProps) {
  const [trackingUrl, setTrackingUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setTrackingUrl(`${origin}/track/${ticketId.toUpperCase()}`);
    }
  }, [ticketId]);

  const handleCopyLink = () => {
    if (!trackingUrl) return;
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast.success('Mobile tracking link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 20, 20, 360, 360);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `complaint-${ticketId}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      DOMURL.revokeObjectURL(url);
      toast.success('QR Code downloaded!');
    };
    image.src = url;
  };

  const qrContent = (
    <div className="flex flex-col items-center text-center">
      <div
        ref={qrRef}
        className="relative flex items-center justify-center rounded-2xl border-2 border-sky-500/30 bg-white p-4 shadow-md transition-all hover:border-sky-500 hover:shadow-lg"
      >
        {trackingUrl ? (
          <QRCodeSVG
            value={trackingUrl}
            size={size}
            level="M"
            includeMargin={true}
          />
        ) : (
          <div className="h-40 w-40 animate-pulse bg-muted rounded-xl" />
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
        <Smartphone className="h-3.5 w-3.5" />
        <span>Scan with mobile camera to view live status</span>
      </div>

      <p className="mt-1 max-w-[220px] text-[11px] text-muted-foreground">
        Point your phone camera at this QR code to track ticket{' '}
        <strong className="text-foreground">{ticketId}</strong> anytime.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="h-8 gap-1.5 text-xs border-border/80"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Link Copied' : 'Copy Mobile Link'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadQr}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          title="Download printable QR Code image"
        >
          <Download className="h-3.5 w-3.5" />
          Save QR
        </Button>
      </div>
    </div>
  );

  if (!showCard) {
    return qrContent;
  }

  return (
    <Card className="border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card shadow-sm">
      <CardHeader className="pb-3 text-center sm:text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <QrCode className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold">Mobile Status QR Code</CardTitle>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Live Scan
          </span>
        </div>
        <CardDescription className="text-xs">
          Open and monitor this grievance on any smartphone.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-1">{qrContent}</CardContent>
    </Card>
  );
}
