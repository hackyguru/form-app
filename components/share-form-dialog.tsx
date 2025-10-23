"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Copy, Check, QrCode, Code, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface ShareFormDialogProps {
  formId: string;
  formTitle: string;
  formCid?: string; // Optional CID for IPFS link
}

export function ShareFormDialog({ formId, formTitle, formCid }: ShareFormDialogProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Use CID if available, otherwise use formId
  const formUrl = formCid 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/forms/view/${formCid}`
    : `https://privateform.app/f/${formId}`;
  const embedCode = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  const copyToClipboard = (text: string, type: "url" | "embed") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  const shareViaEmail = () => {
    window.open(`mailto:?subject=Check out this form: ${formTitle}&body=Fill out this form: ${formUrl}`);
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=Check out this form: ${formTitle} - ${formUrl}`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Share Form</DialogTitle>
          <DialogDescription>
            Share "{formTitle}" with others via link, QR code, or embed it on your website
            {formCid && <span className="block mt-1 text-primary">✓ Stored on IPFS (Decentralized)</span>}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Public Form URL {formCid && <span className="text-primary text-xs">(IPFS)</span>}</Label>
              <div className="flex gap-2">
                <Input value={formUrl} readOnly className="font-mono text-sm" />
                <Button
                  onClick={() => copyToClipboard(formUrl, "url")}
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {formCid 
                  ? "This form is stored on IPFS - it's decentralized and permanent"
                  : "Anyone with this link can access and submit your form"}
              </p>
              {formCid && (
                <p className="text-xs text-muted-foreground mt-2">
                  CID: <code className="bg-muted px-1.5 py-0.5 rounded">{formCid.substring(0, 20)}...</code>
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border-2">
                <QRCodeSVG value={formUrl} size={200} level="H" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to access the form on mobile devices
              </p>
              <Button variant="outline" onClick={() => {
                toast.success("QR code download feature - right-click the QR code to save!");
              }}>
                <QrCode className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
                  {embedCode}
                </pre>
                <Button
                  onClick={() => copyToClipboard(embedCode, "embed")}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  {embedCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Copy and paste this code into your website's HTML
              </p>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Share via</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={shareViaEmail}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={shareViaWhatsApp}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share your form through popular platforms
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
