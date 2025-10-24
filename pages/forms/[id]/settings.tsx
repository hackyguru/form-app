import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { CustomDomainManager } from "@/components/CustomDomainManager";
import {
  ArrowLeft,
  Settings,
  Globe,
  Shield,
  Trash2,
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import FormRegistryIPNSABI from '@/lib/FormRegistryIPNS.abi.json';

interface FormMetadata {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export default function FormSettings() {
  const router = useRouter();
  const { id } = router.query; // This is the IPNS name or custom domain
  const { user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();

  const [loading, setLoading] = useState(true);
  const [formMetadata, setFormMetadata] = useState<FormMetadata | null>(null);
  const [currentDomain, setCurrentDomain] = useState('');
  const [resolvedIPNS, setResolvedIPNS] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    
    if (!authenticated) {
      router.push('/');
      return;
    }

    if (id) {
      loadFormSettings();
    }
  }, [id, authenticated, ready, router]);

  const loadFormSettings = async () => {
    try {
      setLoading(true);
      
      // Resolve ID (could be custom domain or IPNS)
      const ipnsName = await resolveFormId(id as string);
      setResolvedIPNS(ipnsName);

      // Load form metadata from localStorage
      const metadataStr = localStorage.getItem(`form_metadata_${ipnsName}`);
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        setFormMetadata(metadata);
      }

      // Load custom domain status from blockchain
      await loadCustomDomain(ipnsName);
    } catch (error) {
      console.error('Failed to load form settings:', error);
      toast.error('Failed to load form settings');
    } finally {
      setLoading(false);
    }
  };

  const resolveFormId = async (idOrDomain: string): Promise<string> => {
    // If it starts with k51, it's already an IPNS name
    if (idOrDomain.startsWith('k51')) {
      return idOrDomain;
    }

    // Check if it's an old form ID format (form-123456789)
    if (idOrDomain.startsWith('form-')) {
      console.warn('⚠️ Old form ID detected:', idOrDomain);
      toast.error('Old form format not supported', {
        description: 'This form was created with the old system. Please create a new form.',
      });
      // Try to get IPNS from localStorage as fallback
      const ipnsName = localStorage.getItem(`ipns_mapping_${idOrDomain}`);
      if (ipnsName) {
        console.log('✅ Found IPNS mapping in localStorage:', ipnsName);
        return ipnsName;
      }
      throw new Error('Old form format - please create a new form');
    }

    // Otherwise, resolve custom domain to IPNS
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;
      if (!contractAddress) return idOrDomain;

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_STATUS_NETWORK_RPC || 
        'https://public.sepolia.rpc.status.network'
      );
      
      const contract = new ethers.Contract(
        contractAddress,
        FormRegistryIPNSABI,
        provider
      );

      const ipnsName = await contract.resolveToIPNS(idOrDomain);
      return ipnsName;
    } catch (error: any) {
      console.error('Failed to resolve domain:', error);
      
      // If domain not found on blockchain, it might be a custom domain that doesn't exist yet
      if (error.message?.includes('Domain not found')) {
        toast.error('Domain not found', {
          description: 'This custom domain has not been registered',
        });
      }
      
      return idOrDomain;
    }
  };

  const loadCustomDomain = async (ipnsName: string) => {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;
      if (!contractAddress) return;

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_STATUS_NETWORK_RPC || 
        'https://public.sepolia.rpc.status.network'
      );
      
      const contract = new ethers.Contract(
        contractAddress,
        FormRegistryIPNSABI,
        provider
      );

      const formData = await contract.forms(ipnsName);
      const domain = formData.customDomain;
      
      if (domain && domain !== '') {
        setCurrentDomain(domain);
      }
    } catch (error) {
      console.error('Failed to load custom domain:', error);
    }
  };

  const handleDeleteForm = async () => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      if (!authenticated || !user?.wallet?.address || wallets.length === 0) {
        throw new Error('Please connect your wallet');
      }

      const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;
      if (!contractAddress) throw new Error('Contract not configured');

      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      const contract = new ethers.Contract(
        contractAddress,
        FormRegistryIPNSABI,
        signer
      );

      toast.info('Deleting form...', {
        description: 'Please confirm the transaction',
      });

      const tx = await contract.setFormStatus(resolvedIPNS, false);
      
      toast.info('Transaction submitted', {
        description: 'Waiting for confirmation...',
      });

      await tx.wait();

      toast.success('Form deleted', {
        description: 'Redirecting to dashboard...',
      });

      // Clean up local data
      localStorage.removeItem(`form_metadata_${resolvedIPNS}`);
      localStorage.removeItem(`ipns_${resolvedIPNS}`);
      localStorage.removeItem(`ipns_mapping_${resolvedIPNS}`);
      localStorage.removeItem(`cid_${resolvedIPNS}`);

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to delete form:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Failed to delete form', {
          description: error.message || 'Unknown error',
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  const copyIPNSAddress = () => {
    navigator.clipboard.writeText(resolvedIPNS);
    toast.success('IPNS address copied!');
  };

  const copyCustomDomain = () => {
    const url = `${window.location.origin}/forms/${currentDomain}/edit`;
    navigator.clipboard.writeText(url);
    toast.success('Custom domain link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formMetadata) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>
              The form you're looking for doesn't exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Form Settings
              </h1>
              <p className="text-sm text-muted-foreground">{formMetadata.title}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Form Info */}
          <Card>
            <CardHeader>
              <CardTitle>Form Information</CardTitle>
              <CardDescription>
                Basic details about your form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm text-muted-foreground mt-1">{formMetadata.title}</p>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{formMetadata.description || 'No description'}</p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={formMetadata.status === 'published' ? 'default' : 'secondary'}>
                  {formMetadata.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* IPNS Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                IPNS Address
              </CardTitle>
              <CardDescription>
                Permanent, decentralized identifier for your form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg overflow-hidden">
                  <code className="text-xs break-all">{resolvedIPNS}</code>
                </div>
                <Button variant="outline" size="icon" onClick={copyIPNSAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/forms/${resolvedIPNS}/edit`)}
                >
                  Open with IPNS
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* View Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Form Responses
              </CardTitle>
              <CardDescription>
                View and manage responses submitted to your form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push(`/forms/${resolvedIPNS}/responses`)}
                className="w-full"
              >
                View Responses
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Custom Domain Manager */}
          <CustomDomainManager
            formId={resolvedIPNS}
            currentDomain={currentDomain}
            onDomainRegistered={(domain) => {
              setCurrentDomain(domain);
              if (domain) {
                toast.success('Domain updated!', {
                  description: 'Your form settings have been updated',
                });
              }
            }}
          />

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions. Please be careful.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Delete Form</Label>
                <p className="text-sm text-muted-foreground">
                  This will mark your form as inactive on the blockchain. It won't appear on any device,
                  but the data will remain on IPFS.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteForm}
                  disabled={deleting}
                  className="w-full"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Form
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;
}
