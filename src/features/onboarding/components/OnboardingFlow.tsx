import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Settings, Package, Compass, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingFlowProps {
  profile: any;
  cards: any[];
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ profile, cards, onComplete }) => {
  const navigate = useNavigate();

  const step1Done = (cards?.length || 0) > 0;
  const step2Done = Boolean(profile?.companyName && profile?.phone && profile?.email);
  const progress = Math.min(100, Math.round(((Number(step1Done) + Number(step2Done) + 1) / 3) * 100));

  const goToFinance = () => navigate('/finance', { state: { onboarding: true, focus: 'cards' } });
  const goToSettings = () => navigate('/settings', { state: { onboarding: true } });
  const goToPackages = () => navigate('/packages', { state: { onboarding: true } });
  const goToProspects = () => navigate('/prospek', { state: { onboarding: true } });
  const goToNextPage = () => {
    onComplete();
    navigate('/prospek', { replace: true });
  };

  return (
    <section className="fixed inset-x-4 bottom-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-[420px]">
      <div className="rounded-3xl border border-brand-accent/30 bg-white/95 p-5 shadow-2xl shadow-brand-accent/10 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-brand-accent font-black">Onboarding Baru</p>
            <h3 className="mt-1 text-xl font-black text-brand-text-light">Mulai setup bisnis Anda</h3>
            <p className="mt-2 text-sm text-brand-text-secondary">Ikuti 3 langkah singkat agar transaksi dan profil siap dipakai.</p>
          </div>
          <div className="rounded-2xl bg-brand-accent/10 p-3 text-brand-accent">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-text-secondary">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-brand-bg">
            <div className="h-2 rounded-full bg-gradient-to-r from-brand-accent to-blue-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={goToFinance}
            className={`w-full rounded-2xl border p-4 text-left transition ${step1Done ? 'border-emerald-400/50 bg-emerald-50' : 'border-brand-border/70 bg-brand-bg/80 hover:bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${step1Done ? 'bg-emerald-500 text-white' : 'bg-brand-accent/10 text-brand-accent'}`}>
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-brand-text-light">1. Buat kartu keuangan dulu</p>
                <p className="text-xs text-brand-text-secondary">Agar transaksi bisa berjalan dengan benar.</p>
              </div>
              {step1Done && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            </div>
          </button>

          <button
            type="button"
            onClick={goToSettings}
            className={`w-full rounded-2xl border p-4 text-left transition ${step2Done ? 'border-emerald-400/50 bg-emerald-50' : 'border-brand-border/70 bg-brand-bg/80 hover:bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${step2Done ? 'bg-emerald-500 text-white' : 'bg-brand-accent/10 text-brand-accent'}`}>
                <Settings className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-brand-text-light">2. Lengkapi profil di Settings</p>
                <p className="text-xs text-brand-text-secondary">Isi identitas vendor agar dokumen dan kontak siap.</p>
              </div>
              {step2Done && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            </div>
          </button>

          <button
            type="button"
            onClick={goToPackages}
            className="w-full rounded-2xl border border-brand-border/70 bg-brand-bg/80 p-4 text-left transition hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-accent/10 p-2 text-brand-accent">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-brand-text-light">3. Cek paket & layanan</p>
                <p className="text-xs text-brand-text-secondary">Atur paket yang akan dijual ke calon pengantin.</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={goToProspects}
            className="w-full rounded-2xl border border-brand-border/70 bg-brand-bg/80 p-4 text-left transition hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-accent/10 p-2 text-brand-accent">
                <Compass className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-brand-text-light">4. Lanjut ke halaman prospek</p>
                <p className="text-xs text-brand-text-secondary">Masuk ke alur utama bisnis setelah setup selesai.</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={goToNextPage}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-accent to-blue-500 px-4 py-3 text-left text-white shadow-lg shadow-brand-accent/20 transition hover:brightness-105"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">5. Selesai & lanjut</p>
                <p className="text-xs text-white/80">Tandai onboarding selesai dan buka halaman utama.</p>
              </div>
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
