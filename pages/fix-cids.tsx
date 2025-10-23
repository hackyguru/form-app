import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCIDMappings, saveCIDMapping, deleteCIDMapping } from '@/lib/storacha';
import { Trash2, Check, AlertCircle } from 'lucide-react';

export default function FixCIDMappings() {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [fixed, setFixed] = useState<string[]>([]);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = () => {
    const currentMappings = getCIDMappings();
    setMappings(currentMappings);
  };

  const fixCID = (formId: string, cid: string) => {
    // Remove /form-meta.json or any filename from CID
    const cleanCid = cid.replace(/\/[^/]+\.json$/, '');
    
    if (cleanCid !== cid) {
      saveCIDMapping(formId, cleanCid);
      setFixed(prev => [...prev, formId]);
      loadMappings();
    }
  };

  const fixAllCIDs = () => {
    Object.entries(mappings).forEach(([formId, cid]) => {
      fixCID(formId, cid);
    });
  };

  const deleteCID = (formId: string) => {
    deleteCIDMapping(formId);
    loadMappings();
  };

  const needsFix = (cid: string) => {
    return cid.includes('/form-meta.json') || cid.includes('.json');
  };

  const brokenMappings = Object.entries(mappings).filter(([_, cid]) => needsFix(cid));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Fix CID Mappings</CardTitle>
            <CardDescription>
              Remove filename suffixes from CID mappings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {brokenMappings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-semibold">All CID mappings are clean!</p>
                <p className="text-sm">No fixes needed.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm">
                    Found {brokenMappings.length} mapping(s) that need fixing
                  </p>
                </div>

                <Button onClick={fixAllCIDs} className="w-full">
                  Fix All CID Mappings
                </Button>

                <div className="space-y-2">
                  {brokenMappings.map(([formId, cid]) => {
                    const cleanCid = cid.replace(/\/[^/]+\.json$/, '');
                    const isFixed = fixed.includes(formId);

                    return (
                      <div 
                        key={formId}
                        className={`p-4 rounded-lg border ${isFixed ? 'bg-green-500/10 border-green-500/20' : 'bg-muted'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono text-muted-foreground mb-1">
                              {formId}
                            </p>
                            <p className="text-xs font-mono break-all mb-1">
                              <span className="text-red-500">❌ {cid}</span>
                            </p>
                            <p className="text-xs font-mono break-all">
                              <span className="text-green-500">✅ {cleanCid}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {isFixed ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fixCID(formId, cid)}
                                >
                                  Fix
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteCID(formId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">All CID Mappings:</h3>
              <div className="space-y-2">
                {Object.entries(mappings).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No CID mappings found</p>
                ) : (
                  Object.entries(mappings).map(([formId, cid]) => (
                    <div key={formId} className="p-3 bg-muted rounded text-xs font-mono break-all">
                      <div><strong>ID:</strong> {formId}</div>
                      <div><strong>CID:</strong> {cid}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={loadMappings}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
