import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Globe, Check, X, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import FormRegistryIPNSABI from '@/lib/FormRegistryIPNS.abi.json';
import { usePrivy, useWallets } from '@privy-io/react-auth';

interface CustomDomainManagerProps {
  formId: string; // This is the IPNS name
  currentDomain?: string;
  onDomainRegistered?: (domain: string) => void;
}

export function CustomDomainManager({ 
  formId, 
  currentDomain = '',
  onDomainRegistered 
}: CustomDomainManagerProps) {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  const [customDomain, setCustomDomain] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [domainPrice, setDomainPrice] = useState('0.01');
  const [existingDomain, setExistingDomain] = useState(currentDomain);

  // Load domain price from contract
  useEffect(() => {
    loadDomainPrice();
  }, []);

  const loadDomainPrice = async () => {
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

      const price = await contract.domainPrice();
      setDomainPrice(ethers.formatEther(price));
    } catch (error) {
      console.error('Failed to load domain price:', error);
    }
  };

  // Check domain availability
  const checkAvailability = async () => {
    if (!customDomain.trim()) {
      setAvailable(null);
      return;
    }

    // Validate domain format (alphanumeric, hyphens, lowercase)
    const validDomain = /^[a-z0-9-]+$/.test(customDomain);
    if (!validDomain) {
      toast.error('Invalid domain format', {
        description: 'Use only lowercase letters, numbers, and hyphens',
      });
      setAvailable(false);
      return;
    }

    setChecking(true);
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;
      if (!contractAddress) throw new Error('Contract not configured');

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_STATUS_NETWORK_RPC || 
        'https://public.sepolia.rpc.status.network'
      );
      
      const contract = new ethers.Contract(
        contractAddress,
        FormRegistryIPNSABI,
        provider
      );

      // Check if domain is already taken
      const ipnsName = await contract.customDomains(customDomain);
      const isAvailable = ipnsName === '' || ipnsName === '0x';
      
      setAvailable(isAvailable);
      
      if (!isAvailable) {
        toast.info('Domain not available', {
          description: 'This domain is already registered by another form',
        });
      } else {
        toast.success('Domain available!', {
          description: `"${customDomain}" is ready to claim`,
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Failed to check availability');
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  // Register custom domain
  const registerDomain = async () => {
    if (!authenticated || !user?.wallet?.address || wallets.length === 0) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!available) {
      toast.error('Domain not available');
      return;
    }

    setRegistering(true);
    try {
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

      toast.info('Preparing transaction...', {
        description: `Cost: ${domainPrice} ETH`,
      });

      // Register domain with payment
      const tx = await contract.registerCustomDomain(
        formId, // IPNS name
        customDomain,
        { value: ethers.parseEther(domainPrice) }
      );

      toast.info('Transaction submitted', {
        description: 'Waiting for confirmation...',
      });

      await tx.wait();

      toast.success('Custom domain registered!', {
        description: `Your form is now accessible at: /forms/${customDomain}/edit`,
        duration: 5000,
      });

      setExistingDomain(customDomain);
      setCustomDomain('');
      setAvailable(null);
      
      if (onDomainRegistered) {
        onDomainRegistered(customDomain);
      }
    } catch (error: any) {
      console.error('Failed to register domain:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else if (error.message?.includes('Insufficient payment')) {
        toast.error('Insufficient payment', {
          description: `Please send ${domainPrice} ETH`,
        });
      } else {
        toast.error('Failed to register domain', {
          description: error.message || 'Unknown error',
        });
      }
    } finally {
      setRegistering(false);
    }
  };

  // Release custom domain
  const releaseDomain = async () => {
    if (!authenticated || !user?.wallet?.address || wallets.length === 0) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!existingDomain) {
      toast.error('No domain to release');
      return;
    }

    setReleasing(true);
    try {
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

      toast.info('Releasing domain...', {
        description: 'This will make it available for others',
      });

      const tx = await contract.releaseCustomDomain(formId);

      toast.info('Transaction submitted', {
        description: 'Waiting for confirmation...',
      });

      await tx.wait();

      toast.success('Domain released', {
        description: 'Your form now uses the IPNS address only',
      });

      setExistingDomain('');
      
      if (onDomainRegistered) {
        onDomainRegistered('');
      }
    } catch (error: any) {
      console.error('Failed to release domain:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Failed to release domain', {
          description: error.message || 'Unknown error',
        });
      }
    } finally {
      setReleasing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Custom Domain
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </CardTitle>
        <CardDescription>
          Register a memorable URL for your form (e.g., "customer-feedback" instead of "{formId.substring(0, 20)}...")
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {existingDomain ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                <Check className="h-4 w-4" />
                <span className="font-medium">Active Custom Domain</span>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                <span className="font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded">
                  /forms/{existingDomain}/edit
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/forms/${existingDomain}/edit`);
                  toast.success('Link copied!');
                }}
              >
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`/forms/${existingDomain}/edit`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Release domain to make it available for others
              </Label>
              <Button
                variant="destructive"
                onClick={releaseDomain}
                disabled={releasing}
                className="w-full"
              >
                {releasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Release Domain
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Choose Your Domain</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="my-awesome-form"
                    value={customDomain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setCustomDomain(value);
                      setAvailable(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        checkAvailability();
                      }
                    }}
                    disabled={checking || registering}
                  />
                  {available !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {available ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={checkAvailability}
                  disabled={checking || !customDomain.trim()}
                  variant="outline"
                >
                  {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Check
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use only lowercase letters, numbers, and hyphens
              </p>
            </div>

            {available && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Domain Price</span>
                  <Badge variant="secondary">
                    {domainPrice} ETH
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  One-time payment. Domain is yours until you release it.
                </div>
                <Button
                  onClick={registerDomain}
                  disabled={registering}
                  className="w-full"
                >
                  {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Domain
                </Button>
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>💡 Benefits:</strong> Custom domains make your forms easier to share and remember. 
                Your IPNS address will still work as a permanent backup.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
