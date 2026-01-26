import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui';
import { useImportOPML, useExportOPML } from '@/hooks/usePreferences';
import { cn } from '@/lib/utils';

interface OPMLModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OPMLModal({ isOpen, onClose }: OPMLModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [opmlContent, setOpmlContent] = useState('');
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importOPML = useImportOPML();
  const exportOPML = useExportOPML();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setOpmlContent(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!opmlContent.trim()) return;

    try {
      const result = await importOPML.mutateAsync(opmlContent);
      setImportResult(result);
    } catch {
      // Error handled by mutation
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportOPML.mutateAsync();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'arss-subscriptions.opml');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setOpmlContent('');
    setImportResult(null);
    importOPML.reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  OPML Import / Export
                </CardTitle>
                <Button variant="ghost" size="icon-sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Tabs */}
                <div className="flex p-1 gap-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <button
                    onClick={() => setActiveTab('import')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                      activeTab === 'import'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                  <button
                    onClick={() => setActiveTab('export')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                      activeTab === 'export'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                {/* Import Tab */}
                {activeTab === 'import' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Import your RSS subscriptions from another reader using an OPML file.
                    </p>

                    {/* File Upload */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-accent-500 transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium">Click to select OPML file</p>
                      <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".opml,.xml"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {/* OPML Preview */}
                    {opmlContent && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">OPML Content</label>
                        <textarea
                          value={opmlContent}
                          onChange={(e) => setOpmlContent(e.target.value)}
                          rows={6}
                          className="w-full p-3 text-sm font-mono bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
                        />
                      </div>
                    )}

                    {/* Import Result */}
                    {importResult && (
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-medium">Import Complete</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-green-600 dark:text-green-400">
                            {importResult.imported} feeds imported
                          </p>
                          {importResult.skipped > 0 && (
                            <p className="text-yellow-600 dark:text-yellow-400">
                              {importResult.skipped} feeds skipped (already subscribed)
                            </p>
                          )}
                          {importResult.failed > 0 && (
                            <p className="text-red-600 dark:text-red-400">
                              {importResult.failed} feeds failed to import
                            </p>
                          )}
                        </div>
                        {importResult.errors.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400 max-h-24 overflow-y-auto">
                            {importResult.errors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Import Error */}
                    {importOPML.error && (
                      <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">
                          {importOPML.error instanceof Error
                            ? importOPML.error.message
                            : 'Failed to import OPML'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Export Tab */}
                {activeTab === 'export' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Export all your RSS subscriptions to an OPML file that can be imported into other readers.
                    </p>

                    <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium mb-1">arss-subscriptions.opml</p>
                      <p className="text-xs text-gray-400">
                        Contains all your feeds and categories
                      </p>
                    </div>

                    {/* Export Error */}
                    {exportOPML.error && (
                      <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">
                          {exportOPML.error instanceof Error
                            ? exportOPML.error.message
                            : 'Failed to export OPML'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={handleClose}>
                  {importResult ? 'Done' : 'Cancel'}
                </Button>
                {activeTab === 'import' ? (
                  <Button
                    onClick={handleImport}
                    disabled={!opmlContent.trim() || importOPML.isPending}
                  >
                    {importOPML.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import Feeds
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleExport}
                    disabled={exportOPML.isPending}
                  >
                    {exportOPML.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download OPML
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
