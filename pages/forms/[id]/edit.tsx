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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";

export default function EditForm() {
  const router = useRouter();
  const { id } = router.query;

  // Mock form data
  const [formData, setFormData] = useState({
    title: "Customer Feedback Survey",
    description: "Collect feedback from our customers",
  });

  const [isSaving, setIsSaving] = useState(false);

  // Save form function
  const handleSaveForm = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    toast.success("Form saved successfully!", {
      description: "Your changes have been saved to the decentralized network.",
    });
  };

  // Mock form fields with state
  const [formFields, setFormFields] = useState<Array<{
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: Array<{ id: string; value: string }>;
  }>>([
    { id: "1", type: "text", label: "Full Name", placeholder: "Enter your name", required: true },
    { id: "2", type: "email", label: "Email Address", placeholder: "your@email.com", required: true },
    { 
      id: "3", 
      type: "radio", 
      label: "Preferred Contact Method", 
      required: true,
      options: [
        { id: "opt1", value: "Email" },
        { id: "opt2", value: "Phone" },
        { id: "opt3", value: "SMS" },
      ]
    },
    { id: "4", type: "textarea", label: "Additional Comments", placeholder: "Your feedback", required: false },
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
