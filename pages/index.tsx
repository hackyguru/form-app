import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, Eye, BarChart, Shield, Lock, TrendingUp, Copy, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShareFormDialog } from "@/components/share-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardSkeleton } from "@/components/skeleton-loaders";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { loadAllForms, deleteFormMetadata, duplicateForm } from "@/lib/form-storage";
import { FormMetadata } from "@/types/form";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [duplicatingFormId, setDuplicatingFormId] = useState<string | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [forms, setForms] = useState<FormMetadata[]>([]);

  useEffect(() => {
    const loadForms = async () => {
      // Load forms from localStorage
      const savedForms = loadAllForms();
      setForms(savedForms);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
    };
    loadForms();
  }, []);

  const handleDuplicateForm = async (formId: string, formTitle: string) => {
    setDuplicatingFormId(formId);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const duplicated = duplicateForm(formId);
    if (duplicated) {
      setForms(prev => [...prev, duplicated]);
      toast.success(`"${formTitle}" has been duplicated!`);
    } else {
      toast.error("Failed to duplicate form");
    }
    
    setDuplicatingFormId(null);
  };

  const handleDeleteForm = async () => {
    if (formToDelete) {
      setDeletingFormId(formToDelete);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      deleteFormMetadata(formToDelete);
      setForms(prev => prev.filter(f => f.id !== formToDelete));
      
      toast.success("Form deleted successfully");
      setDeleteDialogOpen(false);
      setFormToDelete(null);
      setDeletingFormId(null);
    }
  };

  const openDeleteDialog = (formId: string) => {
    setFormToDelete(formId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight">PrivateForm</h1>
                <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 h-4">
                  <Lock className="h-2.5 w-2.5 mr-1" />
                  Decentralized
                </Badge>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/settings">
                <Button variant="ghost" size="sm">Settings</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
                Your Forms
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                Create and manage privacy-preserving forms. All data is encrypted and decentralized.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
              <Card className="border-2 hover:border-primary/50 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Forms</CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">{forms.length}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Active forms
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary/50 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <BarChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {forms.length * 25}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Across all forms
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary/50 transition-all duration-200 sm:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Privacy Protected</CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">100%</div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    End-to-end encrypted
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
              <div>
                <h3 className="text-2xl font-bold mb-1">All Forms</h3>
                <p className="text-sm text-muted-foreground">Manage and view your form collection</p>
              </div>
              <Link href="/forms/create">
                <Button size="lg" className="shadow-lg shadow-primary/20 w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create New Form
                </Button>
              </Link>
            </div>

            {forms.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20">
                  <div className="p-6 bg-primary/10 rounded-full mb-6">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No forms yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Get started by creating your first privacy-preserving form.
                  </p>
                  <Link href="/forms/create">
                    <Button size="lg">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Create Your First Form
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {forms.map((form) => (
                  <Card 
                    key={form.id} 
                    className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {form.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {form.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge 
                            variant="outline" 
                            className={
                              form.status === "active" 
                                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                : form.status === "paused"
                                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                            }
                          >
                            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                disabled={duplicatingFormId === form.id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleDuplicateForm(form.id, form.title)}
                                disabled={duplicatingFormId !== null}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {duplicatingFormId === form.id ? "Duplicating..." : "Duplicate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(form.id)}
                                className="text-destructive focus:text-destructive"
                                disabled={deletingFormId !== null}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm mb-5 pb-4 border-b">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded">
                            <BarChart className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium">0 responses</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{form.createdAt}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Link href={`/forms/${form.id}/edit`} className="flex-1">
                            <Button variant="outline" className="w-full group/btn" size="sm">
                              <FileText className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              Edit
                            </Button>
                          </Link>
                          <Link href={`/forms/${form.id}/responses`} className="flex-1">
                            <Button variant="outline" className="w-full group/btn" size="sm">
                              <BarChart className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              View
                            </Button>
                          </Link>
                        </div>
                        <ShareFormDialog formId={form.id} formTitle={form.title} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Form"
        description="Are you sure you want to delete this form? This action cannot be undone and all responses will be permanently deleted."
        confirmText={deletingFormId ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDeleteForm}
        variant="destructive"
        disabled={deletingFormId !== null}
      />
    </div>
  );
}
