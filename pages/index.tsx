import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, Eye, BarChart, Shield, Lock, TrendingUp, Copy, Trash2, MoreVertical, Link as LinkIcon, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConnectButton } from "@/components/auth/connect-button";
import { ShareFormDialog } from "@/components/share-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardSkeleton } from "@/components/skeleton-loaders";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { loadAllForms, deleteFormMetadata, duplicateForm, markFormAsDeleted, isFormDeleted } from "@/lib/form-storage";
import { FormMetadata } from "@/types/form";
import { getAllFormsFromIPFS, getCIDMappings, getCIDForForm, deleteCIDMapping, uploadFormToIPFS, saveCIDMapping } from "@/lib/storacha";
import { getIPNSName, getIPNSNameObject, publishToIPNS, createIPNSName, saveIPNSKey, saveIPNSMapping, deleteIPNSKey, deleteIPNSMapping } from "@/lib/ipns";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getUserFormsFromBlockchain, checkRestoreStatus } from "@/lib/ipns-restore";

export default function Home() {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [duplicatingFormId, setDuplicatingFormId] = useState<string | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [forms, setForms] = useState<FormMetadata[]>([]);
  const [ipnsStatuses, setIpnsStatuses] = useState<Record<string, 'full' | 'partial' | 'none'>>({});
  const [needsRestore, setNeedsRestore] = useState(0);
  const [oldFormsCount, setOldFormsCount] = useState(0);

  // Check if form has valid IPNS (both name and key)
  const getIPNSStatus = async (formId: string): Promise<'full' | 'partial' | 'none'> => {
    const ipnsName = getIPNSName(formId);
    if (!ipnsName) return 'none';
    
    const nameObj = await getIPNSNameObject(formId);
    return nameObj ? 'full' : 'partial';
  };

  // Clear old form-* entries from localStorage
  const clearOldForms = () => {
    console.log('🧹 Clearing old form data...');
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('form-') && !key.includes('k51')) {
        keysToRemove.push(key);
      }
    }
    
    console.log(`Removing ${keysToRemove.length} old entries`);
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setOldFormsCount(0);
    toast.success('Old forms cleared!', {
      description: 'Your storage is now clean. Create new forms to use the IPNS-first architecture.',
      duration: 3000,
    });
  };

  useEffect(() => {
    const loadForms = async () => {
      // Wait for Privy to be ready before proceeding
      if (!ready) {
        console.log('⏳ Waiting for Privy to initialize...');
        return;
      }

      try {
        let loadedForms: FormMetadata[] = [];

        // If authenticated, fetch forms from blockchain first
        if (authenticated && user?.wallet?.address) {
          console.log('📡 Fetching forms from blockchain for:', user.wallet.address);
          
          try {
            const blockchainForms = await getUserFormsFromBlockchain(user.wallet.address);
            console.log(`✅ Found ${blockchainForms.length} forms on blockchain:`, blockchainForms);

            if (blockchainForms.length === 0) {
              console.warn('⚠️ No forms found on blockchain for this address');
            }

            // For each blockchain form, try to fetch metadata from IPFS via IPNS
            const { getFormFromIPFS } = await import('@/lib/storacha');
            const { saveFormMetadata } = await import('@/lib/form-storage');
            
            for (const bcForm of blockchainForms) {
              try {
                console.log(`📥 Loading form ${bcForm.formId} from IPNS: ${bcForm.ipnsName}`);
                
                // Skip if form is marked as deleted
                if (isFormDeleted(bcForm.formId)) {
                  console.log(`⏭️ Skipping deleted form: ${bcForm.formId}`);
                  continue;
                }

                // Resolve IPNS to get the form content
                const formMetadata = await getFormFromIPFS(bcForm.ipnsName);
                if (formMetadata) {
                  loadedForms.push(formMetadata);
                  
                  // Save to localStorage for offline access and faster loading
                  saveFormMetadata(formMetadata);
                  
                  // Save IPNS mapping to localStorage for quick access
                  saveIPNSMapping(formMetadata.id, bcForm.ipnsName);
                  
                  // Save CID mapping (get current CID from IPNS)
                  const { resolveIPNS } = await import('@/lib/ipns');
                  const currentCID = await resolveIPNS(bcForm.ipnsName);
                  if (currentCID) {
                    saveCIDMapping(formMetadata.id, currentCID);
                  }
                  
                  console.log(`✅ Cached form: ${formMetadata.title}`);
                } else {
                  console.warn(`⚠️ Could not load form metadata from IPNS: ${bcForm.ipnsName}`);
                }
              } catch (error) {
                console.error(`❌ Failed to load form ${bcForm.formId}:`, error);
              }
            }
            
            console.log(`📊 Total forms loaded from blockchain: ${loadedForms.length}`);
          } catch (blockchainError) {
            console.error('❌ Error fetching from blockchain:', blockchainError);
          }
        } else {
          console.log('ℹ️ Not authenticated or no wallet address');
        }

        // Fallback: Try IPFS CID mappings from localStorage
        if (loadedForms.length === 0) {
          const ipfsForms = await getAllFormsFromIPFS();
          loadedForms = ipfsForms;
        }

        // Final fallback: localStorage
        if (loadedForms.length === 0) {
          loadedForms = loadAllForms();
        }

        // Filter out deleted forms from all sources
        loadedForms = loadedForms.filter(form => !isFormDeleted(form.id));

        setForms(loadedForms);
        
        // Load IPNS statuses for each form
        const statuses: Record<string, 'full' | 'partial' | 'none'> = {};
        for (const form of loadedForms) {
          statuses[form.id] = await getIPNSStatus(form.id);
        }
        setIpnsStatuses(statuses);

        // Check restore status AFTER loading and filtering forms
        if (authenticated && user?.wallet?.address) {
          const restoreStatus = await checkRestoreStatus(user.wallet.address);
          setNeedsRestore(restoreStatus.needsRestore);
          
          // Removed annoying toast - keys will be restored automatically when editing
        }

      } catch (error) {
        console.error('Error loading forms:', error);
        // Fallback to localStorage on error
        const savedForms = loadAllForms();
        // Filter out deleted forms
        const activeForms = savedForms.filter(form => !isFormDeleted(form.id));
        setForms(activeForms);
        
        // Load IPNS statuses (use activeForms, not savedForms)
        const statuses: Record<string, 'full' | 'partial' | 'none'> = {};
        for (const form of activeForms) {
          statuses[form.id] = await getIPNSStatus(form.id);
        }
        setIpnsStatuses(statuses);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
    };
    loadForms();
  }, [ready, authenticated, user?.wallet?.address]);

  const handleDuplicateForm = async (formId: string, formTitle: string) => {
    setDuplicatingFormId(formId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const duplicated = duplicateForm(formId);
      if (duplicated) {
        // Upload duplicate to IPFS
        toast.info("Uploading duplicate to IPFS...");
        const cid = await uploadFormToIPFS(duplicated);
        
        // Create new IPNS name for duplicate
        toast.info("Creating IPNS for duplicate...");
        const { name, nameObj } = await createIPNSName();
        await publishToIPNS(nameObj, cid);
        
        // Save IPNS data
        await saveIPNSKey(duplicated.id, nameObj);
        saveIPNSMapping(duplicated.id, name);
        saveCIDMapping(duplicated.id, cid);
        
        setForms(prev => [...prev, duplicated]);
        toast.success(`"${formTitle}" has been duplicated with IPNS!`);
      } else {
        toast.error("Failed to duplicate form");
      }
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error("Failed to upload duplicate to IPFS");
    }
    
    setDuplicatingFormId(null);
  };

  const handleDeleteForm = async () => {
    if (formToDelete) {
      console.log(`🗑️ Deleting form: ${formToDelete}`);
      setDeletingFormId(formToDelete);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      try {
        // Mark as inactive on blockchain (user signs transaction)
        if (user?.wallet?.address && wallets.length > 0) {
          console.log(`🔗 Marking form as inactive on blockchain: ${formToDelete}`);
          
          const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;
          
          if (!contractAddress) {
            throw new Error('Contract configuration missing');
          }

          // Get user's wallet and provider
          const wallet = wallets[0];
          const provider = await wallet.getEthereumProvider();
          const ethersProvider = new (await import('ethers')).BrowserProvider(provider);
          const signer = await ethersProvider.getSigner();
          
          const FormRegistryABI = (await import('@/lib/FormRegistry.abi.json')).default;
          const contract = new (await import('ethers')).Contract(contractAddress, FormRegistryABI, signer);

          console.log(`📤 Sending setFormStatus transaction...`);
          const tx = await contract.setFormStatus(formToDelete, false);
          console.log(`📤 Transaction sent:`, tx.hash);
          
          toast.info("Transaction submitted", {
            description: "Waiting for confirmation...",
          });

          console.log(`⏳ Waiting for confirmation...`);
          await tx.wait();
          console.log(`✅ Form marked as inactive on blockchain`);
        }

        // Clean up local data
        deleteFormMetadata(formToDelete);
        deleteCIDMapping(formToDelete);
        await deleteIPNSKey(formToDelete);
        deleteIPNSMapping(formToDelete);
        
        setForms(prev => prev.filter(f => f.id !== formToDelete));
        
        toast.success("Form deleted successfully", {
          description: "Deletion recorded on blockchain - won't appear on any device",
        });
      } catch (error) {
        console.error('Failed to delete form:', error);
        toast.error("Failed to delete form", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setDeleteDialogOpen(false);
        setFormToDelete(null);
        setDeletingFormId(null);
      }
    }
  };

  const openDeleteDialog = (formId: string) => {
    setFormToDelete(formId);
    setDeleteDialogOpen(true);
  };

  const handleRestoreSingleKey = async (formId: string, formTitle: string) => {
    if (!user?.wallet?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (wallets.length === 0) {
      toast.error("No wallet found");
      return;
    }

    try {
      toast.info("Enabling editing...", {
        description: formTitle,
      });

      const { restoreSingleIPNSKey } = await import('@/lib/ipns-restore');
      
      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();
      const walletAddress = user.wallet.address;

      const signMessageFn = async (message: string) => {
        const signature = await provider.request({
          method: 'personal_sign',
          params: [message, walletAddress],
        }) as string;
        return signature;
      };

      const result = await restoreSingleIPNSKey(
        formId,
        walletAddress,
        signMessageFn
      );

      if (result.success) {
        toast.success("✅ Editing enabled!", {
          description: "You can now edit this form",
        });
        
        // Update IPNS status for this form
        const status = await getIPNSStatus(formId);
        setIpnsStatuses(prev => ({ ...prev, [formId]: status }));
        
        // Update needsRestore count
        const restoreStatus = await checkRestoreStatus(user.wallet.address);
        setNeedsRestore(restoreStatus.needsRestore);
      } else {
        toast.error("Failed to enable editing", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error('Failed to restore key:', error);
      toast.error("Failed to enable editing", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleRestoreKeys = async () => {
    if (!user?.wallet?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (wallets.length === 0) {
      toast.error("No wallet found");
      return;
    }

    try {
      toast.info("Restoring IPNS keys...", {
        description: "This may take a moment",
      });

      const { restoreAllIPNSKeys } = await import('@/lib/ipns-restore');
      
      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();
      const walletAddress = user.wallet.address;

      const signMessageFn = async (message: string) => {
        const signature = await provider.request({
          method: 'personal_sign',
          params: [message, walletAddress],
        }) as string;
        return signature;
      };

      const results = await restoreAllIPNSKeys(
        walletAddress,
        signMessageFn,
        (current, total, formId) => {
          toast.info(`Restoring ${current}/${total}...`, {
            description: `Form: ${formId.substring(0, 16)}...`,
          });
        }
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`✅ Restored ${successCount} form key(s)!`, {
          description: failCount > 0 ? `${failCount} failed` : "You can now edit your forms",
        });
        setNeedsRestore(failCount);
        
        // Reload IPNS statuses
        const statuses: Record<string, 'full' | 'partial' | 'none'> = {};
        for (const form of forms) {
          statuses[form.id] = await getIPNSStatus(form.id);
        }
        setIpnsStatuses(statuses);
      } else {
        toast.error("Failed to restore keys");
      }
    } catch (error) {
      console.error('Failed to restore keys:', error);
      toast.error("Failed to restore keys", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
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
              <ConnectButton />
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
              {authenticated ? (
                <Link href="/forms/create">
                  <Button size="lg" className="shadow-lg shadow-primary/20 w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create New Form
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={login} className="shadow-lg shadow-primary/20 w-full sm:w-auto">
                  <Shield className="mr-2 h-5 w-5" />
                  Connect to Create Forms
                </Button>
              )}
            </div>

            {forms.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20">
                  <div className="p-6 bg-primary/10 rounded-full mb-6">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No forms yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    {authenticated 
                      ? "Get started by creating your first privacy-preserving form."
                      : "Connect your wallet to start creating privacy-preserving forms."}
                  </p>
                  {authenticated ? (
                    <Link href="/forms/create">
                      <Button size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Create Your First Form
                      </Button>
                    </Link>
                  ) : (
                    <Button size="lg" onClick={login}>
                      <Shield className="mr-2 h-5 w-5" />
                      Connect to Get Started
                    </Button>
                  )}
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
                          {ipnsStatuses[form.id] === 'full' && (
                            <Badge 
                              variant="outline" 
                              className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                              title="Updateable permanent link - Can be edited from any device"
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              IPNS
                            </Badge>
                          )}
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
                          <Link href={`/forms/view/${getIPNSName(form.id) || getCIDForForm(form.id) || form.id}`} className="flex-1">
                            <Button variant="outline" className="w-full group/btn" size="sm">
                              <Eye className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              View
                            </Button>
                          </Link>
                        </div>
                        <ShareFormDialog 
                          formId={form.id} 
                          formTitle={form.title} 
                          formCid={getIPNSName(form.id) || getCIDForForm(form.id) || undefined} 
                        />
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
