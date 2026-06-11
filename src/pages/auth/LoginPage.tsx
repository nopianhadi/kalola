
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types';
import { GoogleIcon } from '@/constants';
import { loginUser } from '@/services/users';
import { Button, Input } from '@/shared/ui';
// import { supabase } from '@/lib/supabaseClient'; // Dinonaktifkan karena migrasi ke local backend


const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const LockIconSvg = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);

const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a18.35 18.35 0 0 1-2.18 3.22" /><path d="M1.42 1.42A19.88 19.88 0 0 0 1 12s4 8 11 8a18.35 18.35 0 0 0 3.22-2.18" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
);


interface LoginProps {
    onLoginSuccess: (user: User) => void;
}


const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const AUTH_TOKEN_STORAGE_KEY = 'vena-authToken';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { user: userData, token } = await loginUser(email, password);

            // Map snake_case from DB to camelCase for the app
            const loggedInUser: User = {
                id: userData.id,
                email: userData.email,
                fullName: userData.fullName || 'User',
                companyName: userData.companyName,
                role: userData.role || 'Admin',
                password: '', // Keamanan: jangan simpan password di memori
                permissions: userData.permissions || [],
                restrictedCards: (userData as any).restrictedCards || []
            };

            window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
            console.info('[Login] Berhasil masuk menggunakan tabel custom users:', loggedInUser.email);
            onLoginSuccess(loggedInUser);

        } catch (err: any) {
            console.error('[Login] Error:', err.message);
            setError(err.message || 'Terjadi kesalahan sistem.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <img src="/assets/images/backgrounds/login-bg.svg" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="w-full max-w-sm mx-auto relative z-10">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50">
                    <div className="mb-4">
                        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-accent transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                            Kembali ke Beranda
                        </Link>
                    </div>
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <img src="/assets/images/logos/light-logo.svg" alt="Weddfin" className="h-10 w-auto" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Login</h1>
                        <p className="text-sm text-slate-500 mt-2">Hey, masukkan detail Anda untuk masuk ke akun Anda</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                                {error}
                            </div>
                        )}
                        <Input
                            id="email"
                            name="email"
                            type="text"
                            required
                            label="Email / Username"
                            placeholder="Masukkan email atau username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<UserIcon className="w-5 h-5" />}
                        />
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                required
                                label="Password"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftIcon={<LockIconSvg className="w-5 h-5" />}
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none"
                                aria-label={isPasswordVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            >
                                {isPasswordVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                isLoading={isLoading}
                                fullWidth
                                size="lg"
                            >
                                Log In
                            </Button>
                        </div>
                    </form>

                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-t border-slate-200" />
                        <span className="mx-4 text-xs font-semibold text-slate-400">ATAU</span>
                        <hr className="flex-grow border-t border-slate-200" />
                    </div>

                    <Button
                        variant="secondary"
                        fullWidth
                        size="lg"
                        leftIcon={<GoogleIcon className="w-5 h-5" />}
                    >
                        Masuk dengan Google
                    </Button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-slate-500">
                            Belum punya akun?{' '}
                            <Link to="/signup" className="font-semibold text-brand-accent hover:underline transition-colors">
                                Daftar sekarang
                            </Link>
                        </p>
                    </div>
                    <div className="text-center mt-3">
                        <Link to="/test-signature" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                            Verifikasi Dokumen Digital
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
