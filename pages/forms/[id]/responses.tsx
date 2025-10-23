import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  ArrowLeft,
  Download,
  Eye,
  Filter,
  Search,
  Calendar,
  Lock,
  Trash2,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useMemo } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

export default function FormResponses() {
  const router = useRouter();
  const { id } = router.query;

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null);

  const handleDeleteResponse = () => {
    if (responseToDelete) {
      toast.success("Response deleted successfully");
      setDeleteDialogOpen(false);
      setResponseToDelete(null);
    }
  };

  const openDeleteDialog = (responseId: string) => {
    setResponseToDelete(responseId);
    setDeleteDialogOpen(true);
  };

  const formData = {
    title: "Customer Feedback Survey",
    description: "Collect feedback from our customers",
  };

  const responses = [
    {
      id: "1",
      submittedAt: "2025-01-15 14:30",
      data: {
        "Full Name": "John Doe",
        "Email Address": "john@example.com",
        "Message": "Great service! Very satisfied with the product quality.",
      },
    },
    {
      id: "2",
      submittedAt: "2025-01-14 09:15",
      data: {
        "Full Name": "Jane Smith",
        "Email Address": "jane@example.com",
        "Message": "Good experience overall. Delivery was fast.",
      },
    },
    {
      id: "3",
      submittedAt: "2025-01-13 16:45",
      data: {
        "Full Name": "Bob Johnson",
        "Email Address": "bob@example.com",
        "Message": "Excellent customer support team. Highly recommended!",
      },
    },
  ];

  const filteredResponses = useMemo(() => {
    let filtered = responses;

    if (searchQuery) {
      filtered = filtered.filter(response =>
        Object.values(response.data).some(value =>
          value.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(response => {
        const responseDate = new Date(response.submittedAt);
        const diffDays = Math.floor((now.getTime() - responseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === "today") return diffDays === 0;
        if (dateFilter === "week") return diffDays <= 7;
        if (dateFilter === "month") return diffDays <= 30;
        return true;
      });
    }

    return filtered;
  }, [responses, searchQuery, dateFilter]);

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <h1 className="text-lg font-bold">Form Responses</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{formData.title}</h2>
          <p className="text-muted-foreground">{formData.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responses.length}</div>
              <p className="text-xs text-muted-foreground">All time submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <p className="text-xs text-muted-foreground">Very high engagement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">🔒</div>
              <p className="text-xs text-muted-foreground">Encrypted & Private</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div>
                <CardTitle className="text-xl">All Responses</CardTitle>
                <CardDescription>View and manage form submissions</CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1.5">
                {filteredResponses.length} of {responses.length} responses
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or message..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={dateFilter !== "all" ? "default" : "outline"}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {dateFilter === "all" ? "All Time" :
                     dateFilter === "today" ? "Today" :
                     dateFilter === "week" ? "This Week" : "This Month"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDateFilter("all")}>
                    {dateFilter === "all" && <Check className="mr-2 h-4 w-4" />}
                    {dateFilter !== "all" && <div className="mr-2 h-4 w-4" />}
                    <Calendar className="mr-2 h-4 w-4" />
                    All Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter("today")}>
                    {dateFilter === "today" && <Check className="mr-2 h-4 w-4" />}
                    {dateFilter !== "today" && <div className="mr-2 h-4 w-4" />}
                    <Calendar className="mr-2 h-4 w-4" />
                    Today
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter("week")}>
                    {dateFilter === "week" && <Check className="mr-2 h-4 w-4" />}
                    {dateFilter !== "week" && <div className="mr-2 h-4 w-4" />}
                    <Calendar className="mr-2 h-4 w-4" />
                    This Week
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter("month")}>
                    {dateFilter === "month" && <Check className="mr-2 h-4 w-4" />}
                    {dateFilter !== "month" && <div className="mr-2 h-4 w-4" />}
                    <Calendar className="mr-2 h-4 w-4" />
                    This Month
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {(searchQuery || dateFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter("all");
                  }}
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredResponses.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">No responses found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || dateFilter !== "all"
                    ? "Try adjusting your filters or search query"
                    : "No responses have been submitted yet"}
                </p>
                {(searchQuery || dateFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setDateFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email Address</TableHead>
                    <TableHead className="hidden sm:table-cell">Submitted At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.map((response, index) => (
                    <TableRow key={response.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{response.data["Full Name"]}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {response.data["Email Address"]}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {response.submittedAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Response Details</DialogTitle>
                                <DialogDescription>
                                  Submitted on {response.submittedAt}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                {Object.entries(response.data).map(([key, value]) => (
                                  <div key={key} className="space-y-2">
                                    <Label className="text-sm font-medium">{key}</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                      <p className="text-sm">{value}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(response.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Response"
        description="Are you sure you want to delete this response? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteResponse}
        variant="destructive"
      />
    </div>
  );
}
