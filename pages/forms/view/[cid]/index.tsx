import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Send, CheckCircle2, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getFormFromIPFS, IPFS_GATEWAY } from "@/lib/storacha";
import { FormMetadata } from "@/types/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function IPFSFormView() {
  const router = useRouter();
  const { cid } = router.query;
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (cid && typeof cid === 'string') {
      loadFormFromIPFS(cid);
    }
  }, [cid]);

  const loadFormFromIPFS = async (cid: string) => {
    try {
      setLoading(true);
      const metadata = await getFormFromIPFS(cid);
      if (metadata) {
        setFormData(metadata);
      }
    } catch (error) {
      console.error('Error loading form from IPFS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Form submitted:', formValues);
    console.log('Form CID:', cid);
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form from IPFS...</p>
          <p className="text-xs text-muted-foreground mt-2">CID: {cid}</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl text-center border-2">
          <CardContent className="pt-12 pb-10">
            <h2 className="text-4xl font-bold mb-4">Form Not Found</h2>
            <p className="text-lg text-muted-foreground mb-4">
              The form could not be loaded from IPFS.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              CID: <code className="bg-muted px-2 py-1 rounded text-xs">{cid}</code>
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mb-8 text-left">
              <p className="text-sm font-semibold mb-2">💡 Possible solutions:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Check the browser console (F12) for detailed error messages</li>
                <li>The CID might point to a directory - check if there's a .json file inside</li>
                <li>The IPFS content might not be fully propagated yet (wait a few minutes)</li>
                <li>Try viewing directly on IPFS gateway (button below)</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => router.push('/')} size="lg">
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open(`${IPFS_GATEWAY}${cid}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on IPFS Gateway
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open(`https://${cid}.ipfs.w3s.link/`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Subdomain Gateway
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Your response has been securely submitted.
            </p>
            <div className="flex items-start gap-3 p-5 bg-linear-to-br from-primary/5 to-primary/10 rounded-xl mb-8 border-2 border-primary/20">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold mb-1">Privacy Protected</p>
                <p className="text-xs text-muted-foreground">
                  This form is stored on IPFS, a decentralized network
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setSubmitted(false)} size="lg" className="shadow-lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Submit Another Response
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open(`${IPFS_GATEWAY}${cid}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Form on IPFS
              </Button>
            </div>
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
                  IPFS
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`${IPFS_GATEWAY}${cid}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View on IPFS</span>
              </Button>
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
              <div className="flex items-start gap-3 p-5 bg-muted rounded-xl border-2 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold mb-1">Stored on IPFS</p>
                  <p className="text-xs text-muted-foreground">
                    This form is permanently stored on the decentralized web
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.open(`${IPFS_GATEWAY}${cid}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Form Metadata on IPFS
              </Button>
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
            
            {/* IPFS Notice */}
            <div className="flex items-start gap-3 p-5 bg-linear-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-900/50">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1.5">
                  Decentralized & Privacy-First
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  This form is stored on IPFS, a decentralized network. Your data is secure and cannot be censored or taken down.
                </p>
                <button
                  onClick={() => window.open(`${IPFS_GATEWAY}${cid}`, '_blank')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 flex items-center gap-1"
                >
                  View form metadata on IPFS
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 sm:space-y-7">
              {formData.fields.map((field) => (
                <div key={field.id} className="space-y-2.5">
                  <Label htmlFor={field.id} className="text-base font-semibold">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  
                  {/* Text Input */}
                  {field.type === "text" && (
                    <Input
                      id={field.id}
                      type="text"
                      placeholder={field.placeholder}
                      required={field.required}
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      minLength={field.validation?.minLength}
                      maxLength={field.validation?.maxLength}
                      pattern={field.validation?.pattern}
                      className="h-11"
                    />
                  )}
                  
                  {/* Email Input */}
                  {field.type === "email" && (
                    <Input
                      id={field.id}
                      type="email"
                      placeholder={field.placeholder}
                      required={field.required}
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="h-11"
                    />
                  )}
                  
                  {/* Number Input */}
                  {field.type === "number" && (
                    <Input
                      id={field.id}
                      type="number"
                      placeholder={field.placeholder}
                      required={field.required}
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="h-11"
                    />
                  )}
                  
                  {/* Phone Input */}
                  {field.type === "phone" && (
                    <Input
                      id={field.id}
                      type="tel"
                      placeholder={field.placeholder}
                      required={field.required}
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="h-11"
                    />
                  )}
                  
                  {/* Date Input */}
                  {field.type === "date" && (
                    <Input
                      id={field.id}
                      type="date"
                      required={field.required}
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="h-11"
                    />
                  )}
                  
                  {/* Textarea */}
                  {field.type === "textarea" && (
                    <Textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      minLength={field.validation?.minLength}
                      maxLength={field.validation?.maxLength}
                      rows={5}
                      className="resize-none"
                    />
                  )}
                  
                  {/* Select Dropdown */}
                  {field.type === "select" && field.options && (
                    <Select
                      value={formValues[field.id]}
                      onValueChange={(value) => handleInputChange(field.id, value)}
                      required={field.required}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={field.placeholder || "Select an option"} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Radio Group */}
                  {field.type === "radio" && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`${field.id}-${option.id}`}
                            name={field.id}
                            value={option.value}
                            checked={formValues[field.id] === option.value}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            required={field.required}
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`${field.id}-${option.id}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {option.value}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Checkbox */}
                  {field.type === "checkbox" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={formValues[field.id] || false}
                        onCheckedChange={(checked) => handleInputChange(field.id, checked)}
                        required={field.required}
                      />
                      <label
                        htmlFor={field.id}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {field.placeholder || field.label}
                      </label>
                    </div>
                  )}
                  
                  {/* Validation Error Message */}
                  {field.validation?.errorMessage && (
                    <p className="text-xs text-muted-foreground">
                      {field.validation.errorMessage}
                    </p>
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
                <span>Stored on IPFS - Decentralized & Permanent</span>
              </div>
            </CardFooter>
          </form>
        </Card>
        )}

        {/* Additional Info */}
        <div className="mt-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <span className="font-bold text-foreground">PrivateForm</span>
              {" "}- Decentralized & privacy-preserving
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            CID: <code className="bg-muted px-2 py-0.5 rounded">{cid}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
