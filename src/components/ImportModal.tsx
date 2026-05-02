import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Modal from './Modal';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: Record<string, string>[]) => void;
  expectedColumns: string[];
  title?: string;
}

export default function ImportModal({ isOpen, onClose, onImport, expectedColumns, title = 'Import Data' }: ImportModalProps) {
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
        setPreview(json.slice(0, 10));
        if (json.length === 0) {
          toast.error('File kosong atau format tidak sesuai');
          return;
        }
        toast.success(`${json.length} baris data ditemukan`);
      } catch {
        toast.error('Gagal membaca file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (preview.length === 0) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }
    const reader = new FileReader();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
      onImport(json);
      setPreview([]);
      setFileName('');
      onClose();
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-3xl">
      <div className="space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Format Kolom yang Diharapkan:</p>
              <p className="mt-1 text-xs">{expectedColumns.join(', ')}</p>
              <p className="mt-2 text-xs">Mendukung file .xlsx, .xls, dan .csv</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
        >
          {fileName ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-green-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">{fileName}</p>
                <p className="text-xs text-gray-500">{preview.length} baris preview</p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Klik untuk memilih file Excel/CSV</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        </div>

        {preview.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {Object.keys(preview[0]).map((key) => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[150px] truncate">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-sm font-medium flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import {preview.length > 0 ? `(${preview.length}+ baris)` : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
}
