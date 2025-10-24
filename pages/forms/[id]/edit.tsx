import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Type,
  TextCursorInput,
  List,
  CheckSquare,
  Calendar,
  Mail,
  Phone,
  Hash,
  Save,
  Eye,
  BarChart,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { loadFormMetadata, saveFormMetadata } from "@/lib/form-storage";
import { FormMetadata, FormField } from "@/types/form";
import { uploadFormToIPFS, saveCIDMapping } from "@/lib/storacha";
import { getIPNSNameObject, getIPNSName, updateIPNS, createIPNSName, publishToIPNS, saveIPNSKey, saveIPNSMapping } from "@/lib/ipns";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { restoreSingleIPNSKey } from "@/lib/ipns-restore";

export default function EditForm() {
  const router = useRouter();
  const { id } = router.query;
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();

  // State for loading
  const [loading, setLoading] = useState(true);
  const [restoringKey, setRestoringKey] = useState(false);
  const [formMetadata, setFormMetadata] = useState<FormMetadata | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "active" as "active" | "paused" | "closed",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Load form data on mount and auto-restore IPNS key if needed
  useEffect(() => {
    const loadFormAndRestoreKey = async () => {
      if (!id || typeof id !== 'string') return;
      
      const metadata = loadFormMetadata(id);
      if (!metadata) {
        toast.error("Form not found", {
          description: "The form you're trying to edit doesn't exist.",
        });
        router.push('/');
        setLoading(false);
        return;
      }

      setFormMetadata(metadata);
      setFormData({
        title: metadata.title,
        description: metadata.description,
        status: metadata.status,
      });
      setFormFields(metadata.fields);

      // Check if IPNS key needs to be restored
      const ipnsName = getIPNSName(id);
      if (ipnsName) {
        const nameObj = await getIPNSNameObject(id);
        
        if (!nameObj && authenticated && user?.wallet?.address && wallets.length > 0) {
          // Key not available locally - auto-restore it!
          console.log('🔐 IPNS key not found locally - auto-restoring...');
          setRestoringKey(true);
          
          toast.info("Restoring editing keys...", {
            description: "Please sign the message to decrypt your keys",
          });
          
          try {
            const wallet = wallets[0];
            const provider = await wallet.getEthereumProvider();
            
            const signMessageFn = async (message: string) => {
              const signature = await provider.request({
                method: 'personal_sign',
                params: [message, user.wallet!.address],
              });
              return signature as string;
            };

            const result = await restoreSingleIPNSKey(
              id,
              user.wallet.address,
              signMessageFn
            );

            if (result.success) {
              toast.success("Editing enabled!", {
                description: `You can now edit "${metadata.title}"`,
              });
            } else {
              toast.error("Failed to restore editing keys", {
                description: result.error || "Unknown error",
              });
            }
          } catch (error) {
            console.error('Failed to restore key:', error);
            toast.error("Failed to restore editing keys", {
              description: "You may not be able to update the permanent link",
            });
          } finally {
            setRestoringKey(false);
          }
        }
      }
      
      setLoading(false);
    };

    loadFormAndRestoreKey();
  }, [id, authenticated, user?.wallet?.address, wallets, router]);

  // Save form function with IPNS update
  const handleSaveForm = async () => {
    if (!formMetadata) return;
    
    setIsSaving(true);
    
    try {
      const updatedMetadata: FormMetadata = {
        ...formMetadata,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        fields: formFields,
        updatedAt: new Date().toISOString(),
      };

      // Step 1: Upload updated form to IPFS (new CID)
      toast.info("Uploading updated form to IPFS...");
      const newCid = await uploadFormToIPFS(updatedMetadata);
      console.log("Updated form uploaded. New CID:", newCid);

      // Step 2: Update IPNS to point to new CID (if available)
      const ipnsName = getIPNSName(formMetadata.id);
      if (ipnsName) {
        // Try to get the signing key
        const nameObj = await getIPNSNameObject(formMetadata.id);
        
        if (nameObj) {
          // We have the key! Update IPNS
          toast.info("Updating IPNS...", {
            description: "Your permanent link will show the updated form",
          });
          
          try {
            await updateIPNS(nameObj, newCid);
            console.log("IPNS updated:", ipnsName, "→", newCid);
            
            toast.success("Form updated successfully!", {
              description: "Your permanent link now shows the updated form!",
            });
          } catch (ipnsError) {
            console.error("IPNS update failed:", ipnsError);
            toast.warning("Form saved to IPFS, but IPNS update failed", {
              description: "The form is saved but the permanent link may show old version",
            });
          }
        } else {
          // IPNS name exists but no signing key - create a NEW IPNS!
          console.warn("IPNS name exists but signing key not found. Creating new IPNS...");
          toast.info("Recreating IPNS with new key...", {
            description: "Lost signing key - creating fresh permanent link",
          });
          
          try {
            // Create brand new IPNS name with new key
            const { name, nameObj } = await createIPNSName();
            console.log("New IPNS name created:", name);
            
            // Publish the new CID to this new IPNS
            await publishToIPNS(nameObj, newCid);
            console.log("Published CID to new IPNS:", name, "→", newCid);
            
            // Save the new IPNS key and update mapping
            await saveIPNSKey(formMetadata.id, nameObj);
            saveIPNSMapping(formMetadata.id, name);
            
            toast.success("Form updated with NEW permanent link!", {
              description: `New IPNS: ${name.slice(0, 20)}... (old link won't update anymore)`,
            });
          } catch (recreateError) {
            console.error("Failed to recreate IPNS:", recreateError);
            toast.warning("Form updated to IPFS only", {
              description: "IPNS signing key not found. Form saved with new CID.",
            });
          }
        }
      } else {
        // No IPNS at all - create one for this form!
        console.log("No IPNS name found, creating new one...");
        toast.info("Creating permanent IPNS link...", {
          description: "This will make future updates easier",
        });
        
        try {
          // Create new IPNS name
          const { name, nameObj } = await createIPNSName();
          console.log("IPNS name created:", name);
          
          // Publish the new CID to IPNS
          await publishToIPNS(nameObj, newCid);
          console.log("Published CID to IPNS:", name, "→", newCid);
          
          // Save the IPNS key and mapping
          await saveIPNSKey(formMetadata.id, nameObj);
          saveIPNSMapping(formMetadata.id, name);
          
          toast.success("Form updated with permanent link!", {
            description: `Your form now has a permanent IPNS address: ${name.slice(0, 20)}...`,
          });
        } catch (ipnsCreateError) {
          console.error("Failed to create IPNS:", ipnsCreateError);
          toast.success("Form updated!", {
            description: "Saved to IPFS (IPNS creation skipped)",
          });
        }
      }

      // Step 3: Save locally as backup
      saveFormMetadata(updatedMetadata);
      saveCIDMapping(formMetadata.id, newCid);
      setFormMetadata(updatedMetadata);
      
    } catch (error) {
      toast.error("Failed to save form", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!formMetadata) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground mb-4">The form you're trying to edit doesn't exist.</p>
            <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;

    const newFields = [...formFields];
    const draggedField = newFields[draggedIndex];
    
    // Remove from old position
    newFields.splice(draggedIndex, 1);
    
    // Insert at new position
    newFields.splice(dropIndex, 0, draggedField);
    
    setFormFields(newFields);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Delete field
  const handleDeleteField = (fieldId: string) => {
    setFormFields(formFields.filter(field => field.id !== fieldId));
  };

  // Add new field
  const handleAddField = (type: string) => {
    const fieldLabels: Record<string, string> = {
      text: "Short Text",
      textarea: "Long Text",
      email: "Email Address",
      phone: "Phone Number",
      number: "Number",
      select: "Dropdown",
      radio: "Multiple Choice",
      checkbox: "Checkboxes",
      date: "Date",
    };

    const needsOptions = ['select', 'radio', 'checkbox'];
    
    const newField: any = {
      id: Date.now().toString(),
      type: type,
      label: fieldLabels[type] || "New Field",
      placeholder: "Enter value",
      required: false,
    };

    // Add default options for choice-based fields
    if (needsOptions.includes(type)) {
      newField.options = [
        { id: `opt-${Date.now()}-1`, value: "Option 1" },
        { id: `opt-${Date.now()}-2`, value: "Option 2" },
        { id: `opt-${Date.now()}-3`, value: "Option 3" },
      ];
    }

    setFormFields([...formFields, newField]);
  };

  // Update field label
  const handleUpdateFieldLabel = (fieldId: string, newLabel: string) => {
    setFormFields(formFields.map(field => 
      field.id === fieldId ? { ...field, label: newLabel } : field
    ));
  };

  // Update field placeholder
  const handleUpdateFieldPlaceholder = (fieldId: string, newPlaceholder: string) => {
    setFormFields(formFields.map(field => 
      field.id === fieldId ? { ...field, placeholder: newPlaceholder } : field
    ));
  };

  // Update field type
  const handleUpdateFieldType = (fieldId: string, newType: string) => {
    const needsOptions = ['select', 'radio', 'checkbox'];
    
    setFormFields(formFields.map(field => {
      if (field.id === fieldId) {
        const updatedField: any = { ...field, type: newType };
        
        // Add options if switching to a choice-based field
        if (needsOptions.includes(newType) && !field.options) {
          updatedField.options = [
            { id: `opt-${Date.now()}-1`, value: "Option 1" },
            { id: `opt-${Date.now()}-2`, value: "Option 2" },
            { id: `opt-${Date.now()}-3`, value: "Option 3" },
          ];
        }
        
        // Remove options if switching away from choice-based field
        if (!needsOptions.includes(newType) && field.options) {
          delete updatedField.options;
        }
        
        return updatedField;
      }
      return field;
    }));
  };

  // Toggle required status
  const handleToggleRequired = (fieldId: string) => {
    setFormFields(formFields.map(field => 
      field.id === fieldId ? { ...field, required: !field.required } : field
    ));
  };

  // Add option to a field
  const handleAddOption = (fieldId: string) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId) {
        const newOption = {
          id: `opt-${Date.now()}`,
          value: `Option ${(field.options?.length || 0) + 1}`
        };
        return {
          ...field,
          options: [...(field.options || []), newOption]
        };
      }
      return field;
    }));
  };

  // Remove option from a field
  const handleRemoveOption = (fieldId: string, optionId: string) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId && field.options) {
        return {
          ...field,
          options: field.options.filter(opt => opt.id !== optionId)
        };
      }
      return field;
    }));
  };

  // Update option value
  const handleUpdateOption = (fieldId: string, optionId: string, newValue: string) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId && field.options) {
        return {
          ...field,
          options: field.options.map(opt => 
            opt.id === optionId ? { ...opt, value: newValue } : opt
          )
        };
      }
      return field;
    }));
  };

  const fieldTypes = [
    { icon: Type, label: "Short Text", value: "text" },
    { icon: TextCursorInput, label: "Long Text", value: "textarea" },
    { icon: Mail, label: "Email", value: "email" },
    { icon: Phone, label: "Phone", value: "phone" },
    { icon: Hash, label: "Number", value: "number" },
    { icon: List, label: "Dropdown", value: "select" },
    { icon: CheckSquare, label: "Multiple Choice", value: "radio" },
    { icon: CheckSquare, label: "Checkboxes", value: "checkbox" },
    { icon: Calendar, label: "Date", value: "date" },
  ];

  // Show loading state while auth is initializing or restoring keys
  if (!ready || loading || restoringKey) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold">
              {restoringKey ? "Restoring editing keys..." : "Loading..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {restoringKey ? "Please sign the message in your wallet" : "Please wait"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication required UI if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold">Edit Form</h1>
                  <p className="text-xs text-muted-foreground">Modify your form</p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button size="sm" onClick={login}>
                  <Shield className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-6">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Authentication Required</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Please connect your wallet or sign in to edit forms. Only authenticated users can modify forms.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" onClick={login} className="gap-2">
                    <Shield className="h-5 w-5" />
                    Connect Wallet
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push("/")}>
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Dashboard
                  </Button>
                </div>
                <div className="mt-8 pt-8 border-t w-full max-w-md">
                  <p className="text-sm text-muted-foreground mb-4 font-medium">Why do I need to sign in?</p>
                  <div className="space-y-3 text-left">
                    <div className="flex gap-3">
                      <div className="p-1.5 bg-primary/10 rounded-full h-fit">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Protect your forms</p>
                        <p className="text-xs text-muted-foreground">Only you can edit your forms</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="p-1.5 bg-primary/10 rounded-full h-fit">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">End-to-end encrypted</p>
                        <p className="text-xs text-muted-foreground">Your data is encrypted and only you can access it</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="p-1.5 bg-primary/10 rounded-full h-fit">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Decentralized storage</p>
                        <p className="text-xs text-muted-foreground">Forms are stored on IPFS, not our servers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold">Edit Form</h1>
                <p className="text-xs text-muted-foreground">Modify your form</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href={`/forms/${id}/responses`} className="hidden md:block">
                <Button variant="outline" size="sm">
                  <BarChart className="mr-2 h-4 w-4" />
                  Responses
                </Button>
              </Link>
              <Link href={`/forms/${id}/preview`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
              </Link>
              <Button size="sm" onClick={handleSaveForm} disabled={isSaving} className="shadow-lg shadow-primary/20">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Panel - Form Settings */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
                <CardDescription>Basic information about your form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input
                    id="form-title"
                    placeholder="Enter form title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea
                    id="form-description"
                    placeholder="Describe your form"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-status">Form Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "paused" | "closed") => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger id="form-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="paused">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Paused
                        </div>
                      </SelectItem>
                      <SelectItem value="closed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Closed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.status === "active" && "Form is accepting responses"}
                    {formData.status === "paused" && "Form is temporarily not accepting responses"}
                    {formData.status === "closed" && "Form is permanently closed"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Privacy Settings</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Shield className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">End-to-end encrypted</p>
                      <p className="text-xs text-muted-foreground">All responses are encrypted</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Fields</CardTitle>
                <CardDescription>Click to add a field to your form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {fieldTypes.map((field) => (
                  <Button
                    key={field.value}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => handleAddField(field.value)}
                  >
                    <field.icon className="mr-2 h-4 w-4" />
                    {field.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Form Builder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Form Preview</CardTitle>
                    <CardDescription>Build your form by adding and arranging fields</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {formFields.length} {formFields.length === 1 ? 'field' : 'fields'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Form Title Display */}
                <div className="p-6 bg-muted/50 rounded-lg border-2 border-dashed">
                  <h2 className="text-2xl font-bold mb-2">{formData.title}</h2>
                  <p className="text-muted-foreground">{formData.description}</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {formFields.length === 0 ? (
                    <Card className="border-2 border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">No fields yet</p>
                        <p className="text-sm text-muted-foreground mb-4">Add fields from the sidebar to build your form</p>
                      </CardContent>
                    </Card>
                  ) : (
                    formFields.map((field, index) => (
                      <Card
                        key={field.id}
                        className={`border-2 transition-all ${
                          draggedIndex === index ? "opacity-50" : ""
                        } ${
                          dragOverIndex === index ? "border-primary shadow-lg scale-105" : "hover:border-primary/50"
                        }`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <CardContent className="pt-6">
                          <div className="flex gap-3">
                            <div className="flex items-start pt-2">
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Field label"
                                  value={field.label}
                                  onChange={(e) => handleUpdateFieldLabel(field.id, e.target.value)}
                                  className="font-medium"
                                />
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`required-${field.id}`}
                                    checked={field.required}
                                    onCheckedChange={() => handleToggleRequired(field.id)}
                                  />
                                  <Label htmlFor={`required-${field.id}`} className="text-sm cursor-pointer whitespace-nowrap">
                                    Required
                                  </Label>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Select value={field.type} onValueChange={(value) => handleUpdateFieldType(field.id, value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Short Text</SelectItem>
                                    <SelectItem value="textarea">Long Text</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                    <SelectItem value="radio">Multiple Choice</SelectItem>
                                    <SelectItem value="checkbox">Checkboxes</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="Placeholder text"
                                  value={field.placeholder || ""}
                                  onChange={(e) => handleUpdateFieldPlaceholder(field.id, e.target.value)}
                                />
                              </div>
                              
                              {/* Options for select, radio, checkbox */}
                              {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Options</Label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddOption(field.id)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Option
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    {field.options?.map((option, optIndex) => (
                                      <div key={option.id} className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground w-6">{optIndex + 1}.</span>
                                        <Input
                                          value={option.value}
                                          onChange={(e) => handleUpdateOption(field.id, option.id, e.target.value)}
                                          placeholder={`Option ${optIndex + 1}`}
                                          className="flex-1"
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveOption(field.id, option.id)}
                                          disabled={(field.options?.length || 0) <= 1}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    {(!field.options || field.options.length === 0) && (
                                      <p className="text-sm text-muted-foreground italic">No options added yet</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Field Preview */}
                              <div className="pt-2">
                                <Label className="text-sm text-muted-foreground mb-2 block">Preview</Label>
                                {field.type === "textarea" ? (
                                  <Textarea placeholder={field.placeholder || "Response will appear here"} disabled className="resize-none" rows={3} />
                                ) : field.type === "select" ? (
                                  <Select disabled>
                                    <SelectTrigger>
                                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.options?.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                          {option.value}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : field.type === "radio" ? (
                                  <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                                    {field.options?.map((option) => (
                                      <div key={option.id} className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground"></div>
                                        <Label className="text-sm">{option.value}</Label>
                                      </div>
                                    ))}
                                    {(!field.options || field.options.length === 0) && (
                                      <p className="text-sm text-muted-foreground italic">Add options to see preview</p>
                                    )}
                                  </div>
                                ) : field.type === "checkbox" ? (
                                  <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                                    {field.options?.map((option) => (
                                      <div key={option.id} className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded border-2 border-muted-foreground"></div>
                                        <Label className="text-sm">{option.value}</Label>
                                      </div>
                                    ))}
                                    {(!field.options || field.options.length === 0) && (
                                      <p className="text-sm text-muted-foreground italic">Add options to see preview</p>
                                    )}
                                  </div>
                                ) : field.type === "date" ? (
                                  <Input type="date" disabled />
                                ) : (
                                  <Input placeholder={field.placeholder || "Response will appear here"} type={field.type} disabled />
                                )}
                              </div>
                            </div>
                            <div className="flex items-start pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteField(field.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Add Field Placeholder */}
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 h-16"
                  size="lg"
                  onClick={() => handleAddField("text")}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add New Field
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
