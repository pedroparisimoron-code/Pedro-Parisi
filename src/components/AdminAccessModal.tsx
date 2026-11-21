import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from 'lucide-react';

interface AdminAccessModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (token: string) => void;
}

interface AdminStatusResponse {
  configured: boolean;
  source: 'env' | 'claimed' | 'unconfigured';
}

export const AdminAccessModal: React.FC<AdminAccessModalProps> = ({
  open,
  onClose,
  onAuthenticated,
}) => {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setLoadingStatus(true);

    let active = true;
    fetch('/api/admin/status')
      .then((res) => res.json() as Promise<AdminStatusResponse>)
      .then((data) => {
        if (!active) return;
        setConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (!active) return;
        setError('No se pudo conectar con el servidor de autenticación.');
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!configured) {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    } else if (!password) {
      setError('Introduce la contraseña de administrador.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = configured ? '/api/admin/login' : '/api/admin/claim';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setError(data.error || 'No se pudo validar el acceso.');
        return;
      }
      onAuthenticated(data.token);
      onClose();
    } catch {
      setError('Error de red al verificar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-access-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-[#E2DFD7] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-[#FAF9F6] border-b border-[#E2DFD7]">
          <div className="flex items-center gap-2.5">
            {configured ? (
              <Lock className="w-4 h-4 text-[#0F3D81]" />
            ) : (
              <KeyRound className="w-4 h-4 text-[#037046]" />
            )}
            <h2
              id="admin-access-title"
              className="font-display text-base font-bold text-[#141413]"
            >
              {loadingStatus
                ? 'Verificando acceso...'
                : configured
                ? 'Acceso de administrador'
                : 'Configurar contraseña de administrador'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de acceso"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2DFD7] bg-white text-[#141413] hover:bg-[#F6F5F1] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {loadingStatus ? (
            <p className="text-sm text-[#575550] py-4">
              Comprobando estado de seguridad del estudio...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="text-xs leading-relaxed text-[#575550]">
                {configured
                  ? 'Introduce tu contraseña para habilitar la creación, edición y gestión de proyectos del portfolio.'
                  : 'Primer acceso detectado. Define la contraseña de administrador para proteger las herramientas de edición del portfolio.'}
              </p>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-[#141413]"
                >
                  {configured ? 'Contraseña' : 'Nueva contraseña (mín. 6 caracteres)'}
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    autoComplete={configured ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] pl-3.5 pr-10 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#575550] hover:text-[#141413] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {!configured && (
                <div>
                  <label
                    htmlFor="admin-confirm-password"
                    className="block text-xs font-semibold text-[#141413]"
                  >
                    Confirmar contraseña
                  </label>
                  <input
                    id="admin-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#0F3D81] focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="text-xs font-medium text-[#E31838]">
                  {error}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#575550]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#037046]" />
                  <span>Verificación en servidor</span>
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-[#0F3D81] text-white text-xs font-semibold hover:bg-[#0B2E63] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {submitting
                    ? 'Verificando...'
                    : configured
                    ? 'Entrar como admin'
                    : 'Guardar y entrar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
