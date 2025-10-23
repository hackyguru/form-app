import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Send, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function FormPreview() {
  const router = useRouter();
  const { id } = router.query;
  const [submitted, setSubmitted] = useState(false);

  // Mock form data
  const formData = {
    title: "Customer Feedback Survey",
    description: "Collect feedback from our customers. Your responses are end-to-end encrypted and stored securely on a decentralized network.",
    status: "active" as "active" | "paused" | "closed", // Change this to test different statuses
  };

  // Mock form fields
  const formFields = [
    { id: "1", type: "text", label: "Full Name", placeholder: "Enter your full name", required: true },
    { id: "2", type: "email", label: "Email Address", placeholder: "your.email@example.com", required: true },
    { id: "3", type: "textarea", label: "Message", placeholder: "Share your feedback with us...", required: false },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 via-background to-blue-50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl text-center border-2 shadow-2xl">
          <CardContent className="pt-12 pb-10">
            <div className="flex justify-center mb-6 animate-bounce">
              <div className="rounded-full bg-linear-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 p-6 shadow-lg">
                <CheckCircle2 className="h-20 w-20 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-linear-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text">
              Thank You!
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              Your response has been securely submitted and encrypted.
            </p>
            <div className="flex items-start gap-3 p-5 bg-linear-to-br from-primary/5 to-primary/10 rounded-xl mb-8 border-2 border-primary/20">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold mb-1">Privacy Protected</p>
                <p className="text-xs text-muted-foreground">
                  Your data is end-to-end encrypted and stored on a decentralized network (IPFS)
                </p>
              </div>
            </div>
            <Button onClick={() => setSubmitted(false)} size="lg" className="shadow-lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Submit Another Response
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">PrivateForm</h1>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-0.5">
                  <Lock className="h-2.5 w-2.5 mr-1" />
                  Secure
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Badge variant="outline" className="hidden sm:flex">Preview Mode</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-3xl">
        {formData.status !== "active" ? (
          <Card className="shadow-2xl border-2 text-center">
            <CardContent className="pt-12 pb-10">
              <div className="flex justify-center mb-6">
                <div className={`rounded-full p-6 shadow-lg ${
                  formData.status === "paused" 
                    ? "bg-linear-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40"
                    : "bg-linear-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40"
                }`}>
                  <Lock className={`h-20 w-20 ${
                    formData.status === "paused"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`} />
                </div>
              </div>
              <h2 className={`text-4xl font-bold mb-4 ${
                formData.status === "paused"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {formData.status === "paused" ? "Form Temporarily Paused" : "Form Closed"}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                {formData.status === "paused" 
                  ? "This form is temporarily not accepting responses. Please check back later."
                  : "This form is no longer accepting responses. Thank you for your interest."}
              </p>
              <div className="flex items-start gap-3 p-5 bg-muted rounded-xl border-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold mb-1">Privacy Protected</p>
                  <p className="text-xs text-muted-foreground">
                    All forms on PrivateForm use end-to-end encryption for maximum privacy
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border-2">
            <CardHeader className="space-y-4 pb-6">
              <div className="space-y-3">
                <CardTitle className="text-3xl sm:text-4xl font-bold">{formData.title}</CardTitle>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {formData.description}
                </CardDescription>
              </div>
            
            {/* Privacy Notice */}
            <div className="flex items-start gap-3 p-5 bg-linear-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-900/50">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1.5">
                  Privacy First
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  This form uses end-to-end encryption. Your responses are encrypted on your device before being sent to a decentralized network. The form creator cannot access your data without your consent.
                </p>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 sm:space-y-7">
              {formFields.map((field) => (
                <div key={field.id} className="space-y-2.5">
                  <Label htmlFor={field.id} className="text-base font-semibold">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={5}
                      className="resize-none"
                    />
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="h-11"
                    />
                  )}
                </div>
              ))}
            </CardContent>

            <CardFooter className="flex flex-col gap-5 pt-6">
              <Button type="submit" size="lg" className="w-full shadow-lg shadow-primary/30 h-12">
                <Send className="mr-2 h-5 w-5" />
                Submit Response
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="p-1 bg-muted rounded">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <span>Protected by end-to-end encryption</span>
              </div>
            </CardFooter>
          </form>
        </Card>
        )}

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <span className="font-bold text-foreground">PrivateForm</span>
              {" "}- Decentralized & privacy-preserving
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
