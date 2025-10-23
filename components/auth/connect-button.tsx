import { usePrivy } from '@privy-io/react-auth';
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, User, Mail, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function ConnectButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <Button disabled variant="outline" size="sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
        Loading...
      </Button>
    );
  }

  // Show connect button if not authenticated
  if (!authenticated) {
    return (
      <Button onClick={login} variant="default" size="sm" className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  // Get user info
  const walletAddress = user?.wallet?.address;
  const email = user?.email?.address;
  const twitter = user?.twitter?.username;
  const google = user?.google?.email;
  const discord = user?.discord?.username;
  const github = user?.github?.username;

  // Determine display name and icon
  let displayName = "User";
  let displayIcon = <User className="h-4 w-4" />;
  let authMethod = "Unknown";

  if (walletAddress) {
    displayName = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    displayIcon = <Wallet className="h-4 w-4" />;
    authMethod = "Wallet";
  } else if (email) {
    displayName = email.split('@')[0];
    displayIcon = <Mail className="h-4 w-4" />;
    authMethod = "Email";
  } else if (google) {
    displayName = google.split('@')[0];
    displayIcon = <Globe className="h-4 w-4" />;
    authMethod = "Google";
  } else if (twitter) {
    displayName = `@${twitter}`;
    displayIcon = <Globe className="h-4 w-4" />;
    authMethod = "Twitter";
  } else if (discord) {
    displayName = discord;
    displayIcon = <Globe className="h-4 w-4" />;
    authMethod = "Discord";
  } else if (github) {
    displayName = github;
    displayIcon = <Globe className="h-4 w-4" />;
    authMethod = "GitHub";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {displayIcon}
          <span className="hidden sm:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span>Account</span>
              <Badge variant="secondary" className="text-xs">
                {authMethod}
              </Badge>
            </div>
            {walletAddress && (
              <div className="flex items-center gap-2 mt-1">
                <Wallet className="h-3 w-3 text-muted-foreground" />
                <code className="text-xs text-muted-foreground font-mono">
                  {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                </code>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{email}</span>
              </div>
            )}
            {google && !email && (
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{google}</span>
              </div>
            )}
            {twitter && (
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">@{twitter}</span>
              </div>
            )}
            {discord && (
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{discord}</span>
              </div>
            )}
            {github && (
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{github}</span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
