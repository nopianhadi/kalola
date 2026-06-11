import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types';
import { registerUser } from '@/services/users';
import { Button, Input } from '@/shared/ui';

// ─── Icons ───────────────────────────────────────────────────────────────────

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const LockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a18.35 18.35 0 0 1-2.18 3.22" />
        <path d="M1.42 1.42A19.88 19.88 0 0 0 1 12s4 8 11 8a18.35 18.35 0 0 0 3.22-2.18" />
        <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Lemah', color: 'bg-red-400' };
    if (score === 2) return { score, label: 'Cukup', color: 'bg-yellow-400' };
    if (score === 3) return { score, label: 'Kuat', color: 'bg-blue-400' };
    return { score: 4, label: 'Sangat Kuat', color: 'bg-green-500' };
}

// ─── Component ────────────────────────────────────────────────────────────────

const AUTH_TOKEN_STORAGE_KEY = 'vena-authToken';

interface SignupPageProps {
    onSignupSuccess: (user: User) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess }) => {
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const strength = getPasswordStrength(password);
    const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fullName.trim()) {
            setError('Nama lengkap tidak boleh kosong.');
            return;
        }
        if (password.length < 8) {
            setError('Password minimal 8 karakter.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }

        setIsLoading(true);
        try {
            const { user: userData, token } = await registerUser({
                email: email.trim(),
                password,
                fullName: fullName.trim(),
                companyName: companyName.trim() || undefined,
            });

            const newUser: User = {
                id: userData.id,
                email: userData.email,
                fullName: userData.fullName || fullName.trim(),
                companyName: userData.companyName || companyName.trim() || undefined,
                role: 'Admin',
                password: '',
                permissions: [],
                restrictedCards: [],
            };

            window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
            onSignupSuccess(newUser);
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <img src="/assets/images/backgrounds/login-bg.svg" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="w-full max-w-sm mx-auto relative z-10">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50">

                    {/* Back link */}
                    <div className="mb-4">
                        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-accent transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                            </svg>
                            Kembali ke Beranda
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-7">
                        <div className="flex justify-center mb-5">
                            <img src="/assets/images/logos/light-logo.svg" alt="Logo" className="h-10 w-auto" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Buat Akun Baru</h1>
                        <p className="text-sm text-slate-500 mt-1.5">Daftar dan mulai kelola bisnis Anda</p>
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Full Name */}
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            label="Nama Lengkap"
                            placeholder="Masukkan nama lengkap Anda"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            leftIcon={<UserIcon className="w-5 h-5" />}
                        />

                        {/* Company Name (optional) */}
                        <Input
                            id="companyName"
                            name="companyName"
                            type="text"
                            label="Nama Studio / Perusahaan"
                            placeholder="Opsional — contoh: Vena Studio"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            leftIcon={<BuildingIcon className="w-5 h-5" />}
                        />

                        {/* Email */}
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            label="Alamat Email"
                            placeholder="nama@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<MailIcon className="w-5 h-5" />}
                        />

                        {/* Password */}
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                label="Password"
                                placeholder="Minimal 8 karakter"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftIcon={<LockIcon className="w-5 h-5" />}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none"
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>

                            {/* Password strength bar */}
                            {password.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-slate-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Kekuatan: <span className="font-medium">{strength.label}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                required
                                label="Konfirmasi Password"
                                placeholder="Ulangi password Anda"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                leftIcon={
                                    confirmPassword.length > 0
                                        ? passwordsMatch
                                            ? <CheckIcon className="w-5 h-5 text-green-500" />
                                            : <LockIcon className="w-5 h-5 text-red-400" />
                                        : <LockIcon className="w-5 h-5" />
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(p => !p)}
                                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none"
                                aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {showConfirm ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                isLoading={isLoading}
                                fullWidth
                                size="lg"
                                disabled={isLoading || (confirmPassword.length > 0 && !passwordsMatch)}
                            >
                                Buat Akun
                            </Button>
                        </div>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="font-semibold text-brand-accent hover:underline transition-colors">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
