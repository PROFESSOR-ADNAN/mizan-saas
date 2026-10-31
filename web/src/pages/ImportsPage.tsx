import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportsPageProps {
  orgId: string;
}

export const ImportsPage: React.FC<ImportsPageProps> = ({ orgId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const { data: sources } = useQuery({
    queryKey: ['datasources', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/datasources`);
      return res.dataSources;
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadMessage(null);

    const sourceId = sources?.[0]?._id;
    if (!sourceId) {
      alert('Create at least one data source before importing CSV.');
      setIsUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem('mizan_token');
      const res = await fetch(`/api/v1/orgs/${orgId}/imports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/csv',
          'x-source-id': sourceId,
          'x-filename': selectedFile.name,
        },
        body: selectedFile,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Import failed');

      setUploadMessage(`Import completed successfully! Processed ${data.job?.totalRows} rows (${data.job?.acceptedCount} accepted, ${data.job?.duplicateCount} duplicates).`);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadMessage(`Import failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Historical Sales CSV Import</h1>
        <p className="text-xs text-slate-500 mt-1">Upload CSV retail files with UTF-8 BOM tolerance and formula injection protection</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-500 transition cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-2">Maximum file size: 10 MB (up to 50,000 rows)</p>
          </div>

          {selectedFile && (
            <p className="text-xs font-semibold text-emerald-700">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}

          {uploadMessage && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
              {uploadMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs shadow-sm transition"
          >
            {isUploading ? 'Streaming & Processing CSV...' : 'Start CSV Import'}
          </button>
        </form>
      </div>
    </div>
  );
};
