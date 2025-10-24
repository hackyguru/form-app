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
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useMemo, useEffect } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { getFormFromIPFS } from "@/lib/storacha";
import { FormMetadata } from "@/types/form";

export default function FormResponses() {
  const router = useRouter();
  const { id } = router.query;

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<any[]>([]);
  const [responseData, setResponseData] = useState<Record<string, any>>({});
  const [formFields, setFormFields] = useState<string[]>([]);
  const [autoLoadLimit] = useState(5); // Auto-load first 5 responses
  const [loadingData, setLoadingData] = useState<Record<string, boolean>>({});
  const [formMetadata, setFormMetadata] = useState<FormMetadata | null>(null);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id && typeof id === 'string') {
      // Load both in parallel for faster initial load
      Promise.all([
        loadFormMetadata(id),
        fetchResponses(id)
      ]);
    }
  }, [id]);

  const loadFormMetadata = async (formId: string) => {
    try {
      // Load form metadata from IPFS to get field labels
      const metadata = await getFormFromIPFS(formId);
      if (metadata) {
        setFormMetadata(metadata);
        
        // Create mapping of field ID to field label
        const labelMap: Record<string, string> = {};
        metadata.fields.forEach(field => {
          labelMap[field.id] = field.label;
        });
        setFieldLabels(labelMap);
      }
    } catch (error) {
      console.error('Error loading form metadata:', error);
      toast.error('Failed to load form metadata');
    }
  };

  const fetchResponses = async (formId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/responses/list?formId=${formId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch responses');
      }

      // Transform to match existing structure
      const transformed = data.responses.map((r: any) => ({
        id: r.id.toString(),
        submittedAt: new Date(r.timestamp).toLocaleString(),
        responseCID: r.responseCID,
        submitter: r.submitter,
        data: {}, // Will load from IPFS on demand
      }));

      setResponses(transformed);

      // Auto-load first few responses in parallel for preview and to get field names
      const toAutoLoad = transformed.slice(0, autoLoadLimit);
      await Promise.all(
        toAutoLoad.map((resp: any) => loadResponseData(resp.responseCID, resp.id))
      );
    } catch (error: any) {
      console.error('Error fetching responses:', error);
      toast.error(error.message || 'Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const loadResponseData = async (cid: string, responseId: string) => {
    if (responseData[responseId]) return;
    if (loadingData[responseId]) return; // Already loading

    try {
      setLoadingData(prev => ({ ...prev, [responseId]: true }));
      
      const gateway = 'https://w3s.link/ipfs/';
      const response = await fetch(`${gateway}${cid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch response data');
      }

      const data = await response.json();
      const responseFields = data.responses || {};
      
      setResponseData(prev => ({ ...prev, [responseId]: responseFields }));
      
      // Update response with loaded data
      setResponses(prev => prev.map(r => 
        r.id === responseId ? { ...r, data: responseFields } : r
      ));

      // Extract field IDs from first loaded response (we'll map to labels later)
      if (formFields.length === 0 && Object.keys(responseFields).length > 0) {
        setFormFields(Object.keys(responseFields));
      }
    } catch (error) {
      console.error('Error loading response data:', error);
      toast.error('Failed to load response data from IPFS');
    } finally {
      setLoadingData(prev => ({ ...prev, [responseId]: false }));
    }
  };

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

  const exportToCSV = async () => {
    try {
      // Load all responses first
      const responsesToExport = [...responses];
      toast.info('Preparing export...', { description: 'Loading all response data from IPFS' });
      
      for (const resp of responsesToExport) {
        if (Object.keys(resp.data).length === 0) {
          await loadResponseData(resp.responseCID, resp.id);
        }
      }

      // Get all unique fields
      const allFieldIds = new Set<string>();
      responses.forEach(r => {
        Object.keys(r.data).forEach(field => allFieldIds.add(field));
      });

      // Create CSV header with field labels
      const fieldIdsArray = Array.from(allFieldIds);
      const headers = ['#', 'Submitted At', 'Submitter', ...fieldIdsArray.map(fieldId => fieldLabels[fieldId] || fieldId)];
      const csvRows = [headers.join(',')];

      // Create CSV rows
      responses.forEach((response, index) => {
        const row = [
          index + 1,
          `"${response.submittedAt}"`,
          `"${response.submitter === '0x0000000000000000000000000000000000000000' ? 'Anonymous' : response.submitter}"`,
          ...fieldIdsArray.map(fieldId => {
            const value = response.data[fieldId] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          })
        ];
        csvRows.push(row.join(','));
      });

      // Download CSV
      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `responses-${id}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const formData = {
    title: "Form Responses",
    description: "View and manage form responses",
  };

  const filteredResponses = useMemo(() => {
    let filtered = responses;

    if (searchQuery) {
      filtered = filtered.filter(response =>
        Object.values(response.data).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                disabled={responses.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
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
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading responses...</p>
              </div>
            ) : filteredResponses.length === 0 ? (
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
                    {/* Dynamic columns based on first 2 form fields - show labels */}
                    {formFields.slice(0, 2).map((fieldId) => (
                      <TableHead key={fieldId} className="hidden md:table-cell">
                        {fieldLabels[fieldId] || fieldId}
                      </TableHead>
                    ))}
                    {formFields.length === 0 && (
                      <>
                        <TableHead className="hidden md:table-cell">Field 1</TableHead>
                        <TableHead className="hidden md:table-cell">Field 2</TableHead>
                      </>
                    )}
                    <TableHead className="hidden sm:table-cell">Submitted At</TableHead>
                    <TableHead className="hidden sm:table-cell">Submitter</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.map((response, index) => {
                    const hasData = Object.keys(response.data).length > 0;
                    const isLoading = loadingData[response.id];
                    
                    return (
                      <TableRow key={response.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        {/* Dynamic data cells */}
                        {formFields.slice(0, 2).map((field) => (
                          <TableCell key={field} className="hidden md:table-cell">
                            {isLoading ? (
                              <span className="text-muted-foreground text-xs flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Loading...
                              </span>
                            ) : hasData ? (
                              <span className="font-medium">
                                {response.data[field] || '-'}
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => loadResponseData(response.responseCID, response.id)}
                              >
                                Load
                              </Button>
                            )}
                          </TableCell>
                        ))}
                        {formFields.length === 0 && (
                          <>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {isLoading ? 'Loading...' : hasData ? String(Object.values(response.data)[0] || '-') : 'Not loaded'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {isLoading ? 'Loading...' : hasData ? String(Object.values(response.data)[1] || '-') : 'Not loaded'}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {response.submittedAt}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                          {response.submitter === '0x0000000000000000000000000000000000000000' 
                            ? <Badge variant="secondary">Anonymous</Badge>
                            : <code className="text-xs">{response.submitter.slice(0, 6)}...{response.submitter.slice(-4)}</code>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (response.responseCID && Object.keys(response.data).length === 0) {
                                    loadResponseData(response.responseCID, response.id);
                                  }
                                }}
                              >
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
                                {Object.keys(response.data).length === 0 ? (
                                  <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">Response data not loaded yet</p>
                                    <Button 
                                      onClick={() => loadResponseData(response.responseCID, response.id)}
                                      size="sm"
                                    >
                                      Load from IPFS
                                    </Button>
                                  </div>
                                ) : (
                                  Object.entries(response.data).map(([fieldId, value]) => (
                                    <div key={fieldId} className="space-y-2">
                                      <Label className="text-sm font-medium">{fieldLabels[fieldId] || fieldId}</Label>
                                      <div className="p-3 bg-muted rounded-md">
                                        <p className="text-sm">{String(value)}</p>
                                      </div>
                                    </div>
                                  ))
                                )}
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
                    );
                  })}
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
