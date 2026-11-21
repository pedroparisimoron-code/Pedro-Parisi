import React, { useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface PdfManualModalProps {
  open: boolean;
  onClose: () => void;
}

const PDF_PATH = '/assets/aistudio/Manual_De_Marca_Kapsula_c549fcc9.pdf';

export const PdfManualModal: React.FC<PdfManualModalProps> = ({
  open,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/85 backdrop-blur-sm p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-manual-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl bg-white border border-[#E2DFD7] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#E2DFD7] bg-[#FAF9F6]">
          <div>
            <h2
              id="pdf-manual-title"
              className="font-display text-lg font-bold text-[#141413]"
            >
              Manual de Marca Kápsula (PDF original)
            </h2>
            <p className="text-xs text-[#575550]">
              10 páginas · Normativa visual, paleta cromática y aplicaciones
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={PDF_PATH}
              download="Manual_De_Marca_Kapsula.pdf"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F3D81] text-white text-xs font-medium hover:bg-[#0B2E63] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar visor de manual PDF"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#141413] text-white hover:bg-[#E31838] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#EAE7DF]">
          <iframe
            src={PDF_PATH}
            title="Manual de Marca Kápsula PDF"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
