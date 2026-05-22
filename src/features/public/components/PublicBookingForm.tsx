import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { REGIONS, Package, AddOn, Profile, Card, PromoCode, ClientStatus, PaymentStatus, TransactionType, ClientType, BookingStatus } from '@/types';
import { useApp } from "@/app/AppContext";
import { listPackages } from '@/services/packages';
import { listAddOns } from '@/services/addOns';
import { listCards } from '@/services/cards';
import { listPromoCodes } from '@/services/promoCodes';
import { getProfile } from '@/services/profile';

import Modal from '@/shared/ui/Modal';
import { createClient } from '@/services/clients';
import { createProject } from '@/services/projects';
import { uploadDpProof } from '@/services/storage';
import { createTransaction } from '@/services/transactions';
import { generatePrettyAccessId } from '@/utils/idUtils';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

const initialFormState = {
    clientName: '',
    email: '',
    phone: '',
    instagram: '',
    projectType: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    packageId: '',
    selectedAddOnIds: [] as string[],
    promoCode: '',
    dp: '',
    dpPaymentRef: '', // Client adds this for reference
    transportCost: '',
    durationSelection: '' as string,
    unitPrice: undefined as number | undefined,
    address: '',
};


interface PublicBookingProps {
    userProfile?: Profile;
    showNotification?: (message: string) => void;
}

const PublicBookingForm: React.FC<PublicBookingProps> = (props) => {
    const { showNotification: contextShowNotification } = useApp();
    const showNotification = props.showNotification || contextShowNotification;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { vendorId } = useParams<{ vendorId: string }>();
    const regionParam = searchParams.get('region');
    const initialRegion = regionParam ? regionParam.toLowerCase() : null;
    const packageIdParam = searchParams.get('packageId');
    const durationParam = searchParams.get('duration');

    // Independent state for public form
    const [packages, setPackages] = useState<Package[]>([]);
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [userProfile, setUserProfile] = useState<Profile | undefined>(props.userProfile);
    const [cards, setCards] = useState<Card[]>([]);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data independently
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsInitialLoading(true);
                const [pkgs, ads, crds, promos, profileData] = await Promise.all([
                    listPackages(),
                    listAddOns(),
                    listCards(),
                    listPromoCodes(),
                    !props.userProfile ? getProfile(vendorId ? Number(vendorId) : undefined) : Promise.resolve(props.userProfile)
                ]);
                setPackages(pkgs);
                setAddOns(ads);
                setCards(crds as any);
                setPromoCodes(promos as any || []);
                if (profileData) setUserProfile(profileData);
                setError(null);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Gagal memuat data. Silakan coba lagi nanti.');
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadData();
    }, [props.userProfile]);

    const [formData, setFormData] = useState({ ...initialFormState, projectType: '' });

    // Update projectType once userProfile is loaded
    useEffect(() => {
        if (userProfile?.projectTypes?.length && !formData.projectType) {
            setFormData(prev => ({ ...prev, projectType: userProfile?.projectTypes?.[0] || '' }));
        }
    }, [userProfile, formData.projectType]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [promoFeedback, setPromoFeedback] = useState({ type: '', message: '' });
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const promoParam = searchParams.get('promo') || searchParams.get('promoCode');
    useEffect(() => {
        if (promoParam) {
            setFormData(prev => ({ ...prev, promoCode: promoParam.toUpperCase() }));
            if (promoCodes.length > 0) {
                const promo = promoCodes.find(p => p.code === promoParam.toUpperCase() && p.isActive);
                if (promo) {
                    setPromoFeedback({ type: 'success', message: `Promo dari URL berhasil digunakan! ${promo.discountType === 'percentage' ? promo.discountValue + '%' : 'Rp ' + promo.discountValue.toLocaleString('id-ID')}` });
                } else {
                    setPromoFeedback({ type: 'error', message: 'Kode promo di URL tidak valid atau kadaluarsa.' });
                }
            }
        }
    }, [promoParam, promoCodes]);

    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(initialRegion);
    const [isPackagesLoading, setIsPackagesLoading] = useState(true);

    // CSRF Protection: Honeypot field (invisible to humans, visible to bots)
    const [honeypot, setHoneypot] = useState('');

    // Rate limiting: Prevent rapid submissions
    const [lastSubmitTime, setLastSubmitTime] = useState(0);
    const SUBMIT_COOLDOWN = 5000; // 5 seconds

    // Regions discovery for landing gate (must be outside conditional to respect hooks rules)
    const existingRegions = useMemo(() => {
        const set = new Set<string>();
        for (const p of packages) {
            if (p.region && String(p.region).trim() !== '') set.add(String(p.region));
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [packages]);
    const unionRegions = useMemo(() => {
        const baseVals = REGIONS.map(r => r.value);
        const extra = existingRegions.filter(er => !baseVals.includes(er));
        return [
            ...REGIONS.map(r => ({ value: r.value, label: r.label })),
            ...extra.map(er => ({ value: er, label: titleCase(er) })),
        ];
    }, [existingRegions]);

    // Filter Packages by selectedRegion (strict)
    const filteredPackages = useMemo(() => {
        if (!selectedRegion) {
            if (import.meta.env.DEV) {
                console.log('No region selected, returning empty packages');
            }
            return [] as Package[];
        }
        const filtered = packages.filter(p => {
            const pkgRegion = p.region ? String(p.region).toLowerCase() : '';
            return pkgRegion === selectedRegion.toLowerCase();
        });
        if (import.meta.env.DEV) {
            console.log(`Filtered ${filtered.length} packages for region:`, selectedRegion);
        }
        return filtered;
    }, [packages, selectedRegion]);

    // When filteredPackages changes (data loads after region set), reset packageId if current
    // selection is no longer valid, and mark loading as done once packages arrive
    useEffect(() => {
        if (selectedRegion) {
            setIsPackagesLoading(false);
            setFormData(prev => {
                if (prev.packageId && !filteredPackages.find(p => String(p.id) === String(prev.packageId))) {
                    return { ...prev, packageId: '', durationSelection: '', unitPrice: undefined };
                }
                return prev;
            });
        }
    }, [filteredPackages, selectedRegion]);

    // Filter Add-Ons by selectedRegion (strict)
    const filteredAddOns = useMemo(() => {
        if (!selectedRegion) return [] as AddOn[];
        return addOns.filter(a => {
            const addonRegion = a.region ? String(a.region).toLowerCase() : '';
            return addonRegion === selectedRegion.toLowerCase();
        });
    }, [addOns, selectedRegion]);

    // Parse region from URL parameters
    // Sync region from URL if it changes after initial load
    useEffect(() => {
        if (regionParam) {
            const normalizedRegion = regionParam.toLowerCase();
            if (selectedRegion !== normalizedRegion) {
                setSelectedRegion(normalizedRegion);
            }
        } else if (selectedRegion !== null) {
            setSelectedRegion(null);
        }
    }, [regionParam, selectedRegion]);

    // Pre-fill package and duration from URL
    useEffect(() => {
        if (packages.length === 0 || !packageIdParam) return;

        const pkg = packages.find(p => String(p.id) === String(packageIdParam));
        if (pkg) {
            const normalizedRegion = pkg.region?.toLowerCase();
            if (normalizedRegion && normalizedRegion !== selectedRegion) {
                setSelectedRegion(normalizedRegion);
            }

            const durationOpt = pkg.durationOptions?.find(o => o.label === durationParam) || pkg.durationOptions?.find(o => o.default) || pkg.durationOptions?.[0];
            
            setFormData(prev => ({
                ...prev,
                packageId: String(pkg.id),
                durationSelection: durationOpt?.label || '',
                unitPrice: durationOpt ? Number(durationOpt.price) : Number(pkg.price)
            }));
        }
    }, [packages, packageIdParam, durationParam]);

    const template = userProfile?.publicPageConfig?.template || 'classic';

    const formattedTerms = useMemo(() => {
        if (!userProfile?.termsAndConditions) return null;
        return userProfile?.termsAndConditions?.split('\n').map((line, index) => {
            if (line.trim() === '') return <div key={index} className="h-4"></div>;
            const emojiRegex = /^(📜|📅|💰|📦|⏱|➕)\s/;
            if (emojiRegex.test(line)) {
                return <h3 key={index} className="text-lg font-semibold text-gradient mt-4 mb-2">{line}</h3>;
            }
            if (line.trim().startsWith('- ')) {
                return <p key={index} className="ml-4 text-brand-text-primary">{line.trim().substring(2)}</p>;
            }
            return <p key={index} className="text-brand-text-primary">{line}</p>;
        });
    }, [userProfile?.termsAndConditions]);


    const { totalBeforeDiscount, discountAmount, totalProject, discountText } = useMemo(() => {
        const selectedPackage = filteredPackages.find(p => String(p.id) === String(formData.packageId));
        let packagePrice = selectedPackage?.price || 0;
        const opts = selectedPackage?.durationOptions;
        if (opts && opts.length > 0) {
            const selected = opts.find(o => o.label === formData.durationSelection) || opts.find(o => o.default) || opts[0];
            packagePrice = selected?.price ?? (selectedPackage?.price || 0);
        }
        const addOnsPrice = filteredAddOns
            .filter(addon => formData.selectedAddOnIds.includes(String(addon.id)))
            .reduce((sum, addon) => sum + Number(addon.price || 0), 0);

        const transportFee = Number(formData.transportCost) || 0;
        const totalBeforeDiscount = packagePrice + addOnsPrice;
        let discountAmount = 0;
        let discountText = '';


        const enteredPromoCode = formData.promoCode.toUpperCase().trim();
        if (enteredPromoCode) {
            const promoCode = promoCodes.find(p => p.code === enteredPromoCode && p.isActive);
            if (promoCode) {
                const isExpired = promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date();
                const isMaxedOut = promoCode.maxUsage != null && promoCode.usageCount >= promoCode.maxUsage;

                if (!isExpired && !isMaxedOut) {
                    if (promoCode.discountType === 'percentage') {
                        discountAmount = (totalBeforeDiscount * promoCode.discountValue) / 100;
                        discountText = `${promoCode.discountValue}%`;
                    } else {
                        discountAmount = promoCode.discountValue;
                        discountText = formatCurrency(promoCode.discountValue);
                    }
                }
            }
        }

        const totalProject = totalBeforeDiscount - discountAmount + transportFee;
        return { totalBeforeDiscount, discountAmount, totalProject, discountText };
    }, [formData.packageId, formData.selectedAddOnIds, formData.promoCode, formData.transportCost, formData.durationSelection, filteredPackages, filteredAddOns, promoCodes]);

    // Handle Promo Feedback separately to avoid infinite re-renders
    useEffect(() => {
        const enteredPromoCode = formData.promoCode.toUpperCase().trim();
        let newFeedback = { type: '', message: '' };

        if (enteredPromoCode) {
            const promoCode = promoCodes.find(p => p.code === enteredPromoCode && p.isActive);
            if (promoCode) {
                const isExpired = promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date();
                const isMaxedOut = promoCode.maxUsage != null && promoCode.usageCount >= promoCode.maxUsage;

                if (isExpired || isMaxedOut) {
                    newFeedback = { type: 'error', message: 'Kode promo tidak valid atau sudah habis.' };
                } else {
                    const discountDisplay = promoCode.discountType === 'percentage' 
                        ? `${promoCode.discountValue}%` 
                        : formatCurrency(promoCode.discountValue);
                    newFeedback = { type: 'success', message: `Kode promo diterapkan! Diskon ${discountDisplay}.` };
                }
            } else {
                newFeedback = { type: 'error', message: 'Kode promo tidak ditemukan.' };
            }
        }

        setPromoFeedback(current => {
            if (current.type === newFeedback.type && current.message === newFeedback.message) {
                return current;
            }
            return newFeedback;
        });
    }, [formData.promoCode, promoCodes]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { id, checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, selectedAddOnIds: checked ? [...prev.selectedAddOnIds, id] : prev.selectedAddOnIds.filter(addOnId => addOnId !== id) }));
        } else {
            // If packageId changed, set unitPrice from package price or first duration option
            if (name === 'packageId') {
                const pkg = filteredPackages.find(p => String(p.id) === String(value));
                if (pkg) {
                    const opts = pkg.durationOptions;
                    if (opts && opts.length > 0) {
                        const defaultOpt = opts.find(o => o.default) || opts[0];
                        setFormData(prev => ({
                            ...prev,
                            packageId: value,
                            durationSelection: defaultOpt.label,
                            unitPrice: Number(defaultOpt.price)
                        }));
                        return;
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            packageId: value,
                            unitPrice: Number(pkg.price)
                        }));
                        return;
                    }
                }
            }
            // If durationSelection changed, compute unitPrice from selected package's durationOptions
            if (name === 'durationSelection') {
                const pkg = filteredPackages.find(p => String(p.id) === String(formData.packageId));
                const opts = pkg?.durationOptions;
                if (opts && opts.length > 0) {
                    const opt = opts.find(o => o.label === value) || opts.find(o => o.default) || opts[0];
                    if (opt) {
                        setFormData(prev => ({ ...prev, durationSelection: value, unitPrice: Number(opt.price) }));
                        return;
                    }
                }
            }
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                showNotification('Ukuran file tidak boleh melebihi 10MB.');
                if (e.target) e.target.value = ''; // Reset file input
                return;
            }
            setPaymentProof(file);
            
            // Generate preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPaymentProofPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setPaymentProofPreview(null);
            }
        }
    };

    const validateStep1 = () => {
        if (!formData.clientName.trim()) {
            showNotification && showNotification('Nama Pengantin wajib diisi.');
            return false;
        }
        if (!formData.phone.trim()) {
            showNotification && showNotification('Nomor Telepon (WhatsApp) wajib diisi.');
            return false;
        }
        if (!formData.projectType) {
            showNotification && showNotification('Jenis Acara Pernikahan wajib diisi.');
            return false;
        }
        if (!formData.date) {
            showNotification && showNotification('Tanggal Acara Pernikahan wajib diisi.');
            return false;
        }
        if (!formData.location.trim()) {
            showNotification && showNotification('Lokasi (Kota) wajib diisi.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.packageId) {
            showNotification && showNotification('Silakan pilih Package terlebih dahulu.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // CSRF Protection: Check honeypot
        if (honeypot !== '') {
            console.warn('[Security] Bot detected - honeypot triggered');
            return; // Silent fail for bots
        }

        // Rate limiting: Check cooldown
        const now = Date.now();
        if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
            showNotification('Mohon tunggu beberapa detik sebelum mengirim lagi');
            return;
        }

        setLastSubmitTime(now);
        setIsSubmitting(true);
        try {

            const dpAmount = Number(formData.dp) || 0;
            const selectedPackage = filteredPackages.find(p => String(p.id) === String(formData.packageId));
            if (!selectedPackage) {
                alert('Silakan pilih Package.');
                setIsSubmitting(false);
                return;
            }

            const destinationCard = cards.find(c => String(c.id) !== 'CARD_CASH') || cards[0];
            if (!destinationCard) {
                alert('Sistem pembayaran tidak dikonfigurasi. Hubungi vendor.');
                setIsSubmitting(false);
                return;
            }

            let promoCodeAppliedId: number | undefined;
            if (discountAmount > 0 && formData.promoCode) {
                const promoCode = promoCodes.find(p => p.code === formData.promoCode.toUpperCase().trim());
                if (promoCode) promoCodeAppliedId = promoCode.id;
            }

            let dpProofUrl = '';
            if (paymentProof) {
                try {
                    // Upload ke Storage dan pakai URL-nya
                    dpProofUrl = await uploadDpProof(paymentProof);
                } catch (err: any) {
                    console.error('[Storage] error:', err);
                    alert(`Gagal menyimpan bukti pembayaran. ${err?.message || 'Coba lagi.'}`);
                    setIsSubmitting(false);
                    return;
                }
            }

            const selectedAddOns = addOns.filter(addon => formData.selectedAddOnIds.includes(String(addon.id)));
            const remainingPayment = totalProject - dpAmount;
            const transportFee = Number(formData.transportCost) || 0;

            // Create client
            const createdClient = await createClient({
                name: formData.clientName,
                email: formData.email,
                phone: formData.phone,
                instagram: formData.instagram || undefined,
                since: new Date().toISOString().split('T')[0],
                status: ClientStatus.ACTIVE,
                clientType: ClientType.DIRECT,
                lastContact: new Date().toISOString(),
                portalAccessId: generatePrettyAccessId(formData.clientName),
                address: formData.address || undefined,
            });

            // Create project
            const createdProject = await createProject({
                projectName: `${formData.clientName} (${selectedPackage.name})`,
                clientName: createdClient.name,
                clientId: createdClient.id,
                projectType: formData.projectType,
                packageName: selectedPackage.name,
                date: formData.date,
                location: formData.location,
                status: 'Dikonfirmasi',
                bookingStatus: BookingStatus.BARU,
                totalCost: totalProject,
                amountPaid: dpAmount,
                paymentStatus: dpAmount > 0 ? (remainingPayment <= 0 ? PaymentStatus.LUNAS : PaymentStatus.DP_TERBAYAR) : PaymentStatus.BELUM_BAYAR,
                notes: `Referensi Pembayaran DP: ${formData.dpPaymentRef}${formData.durationSelection ? ` | Durasi dipilih: ${formData.durationSelection}` : ''}`,
                durationSelection: formData.durationSelection || undefined,
                unitPrice: formData.unitPrice !== undefined ? Number(formData.unitPrice) : undefined,
                promoCodeId: promoCodeAppliedId,
                discountAmount: discountAmount > 0 ? discountAmount : undefined,
                transportCost: transportFee > 0 ? transportFee : undefined,
                completedDigitalItems: [],
                dpProofUrl: dpProofUrl || undefined,
                address: formData.address || undefined,
                addOns: selectedAddOns.map(a => ({ id: a.id, name: a.name, price: a.price })),
            });

            if (dpAmount > 0) {
                const today = new Date().toISOString().split('T')[0];
                try {
                    await createTransaction({
                        date: today,
                        description: `DP Acara Pernikahan ${createdProject.projectName}`,
                        amount: dpAmount,
                        type: TransactionType.INCOME,
                        projectId: createdProject.id,
                        category: 'DP Acara Pernikahan',
                        method: 'Transfer Bank',
                        cardId: destinationCard.id,
                    } as any);
                } catch (err) {
                    console.error('Gagal mencatat transaksi DP:', err);
                }

            }

            setIsSubmitted(true);
        } catch (err: any) {
            console.error('Error submitting public booking form:', err);
            showNotification && showNotification(typeof err === 'string' ? err : (err?.message || 'Terjadi kesalahan saat mengirim formulir. Silakan coba lagi.'));
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isInitialLoading || !userProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8 bg-public-surface rounded-2xl shadow-lg border border-public-border">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Terjadi Kesalahan</h2>
                    <p className="text-public-text-secondary mb-6">{error}</p>
                    <button onClick={() => navigate(0)} className="button-primary">Coba Lagi</button>
                </div>
            </div>
        );
    }

    if (isSubmitted) {

        return (
            <div className="flex items-center justify-center min-h-screen p-3 md:p-4">
                <div className="w-full max-w-2xl p-6 md:p-8 text-center bg-public-surface rounded-2xl shadow-lg border border-public-border">
                    <h1 className="text-xl md:text-2xl font-bold text-gradient">Terima Kasih!</h1>
                    <p className="mt-4 text-sm md:text-base text-public-text-primary mb-6">Formulir pemesanan Anda telah berhasil kami terima. Tim kami akan segera menghubungi Anda untuk konfirmasi lebih lanjut.</p>
                    <button
                        type="button"
                        onClick={() => {
                            setIsSubmitted(false);
                            setFormData({ ...initialFormState, projectType: userProfile?.projectTypes?.[0] || '' });
                            setPaymentProof(null);
                            setPromoFeedback({ type: '', message: '' });
                            setHoneypot('');
                        }}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                        Buat Booking Baru
                    </button>
                </div>
            </div>
        );
    }
    // Region gate: do not show all regions. Ask user to choose a region link first.
    if (!selectedRegion) {
        return (
            <div className="flex items-center justify-center min-h-screen p-3 md:p-4">
                <div className="w-full max-w-lg p-6 md:p-8 text-center bg-public-surface rounded-2xl shadow-lg border border-public-border">
                    <h4 className="text-xl font-bold text-gradient mb-6">Informasi Pengantin & Acara Pernikahan</h4>
                    <p className="mt-3 text-public-text-secondary text-xs md:text-sm">Untuk meminimalisir kesalahan, silakan pilih wilayah terlebih dahulu.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                        {unionRegions.map(r => (
                            <Link 
                                key={r.value} 
                                className="button-primary text-center" 
                                to={`/public-booking?region=${r.value}`}
                            >
                                {r.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const suggestedDp = totalProject * 0.3;

    const selectedAddOns = addOns.filter(addon => formData.selectedAddOnIds.includes(String(addon.id)));

    const selectedPackage = filteredPackages.find(p => String(p.id) === String(formData.packageId));
    const selectedDurationOpt = selectedPackage?.durationOptions?.find(o => o.label === formData.durationSelection);

    const handleApplyPromo = () => {
        if (!formData.promoCode) {
            setPromoFeedback({ type: 'error', message: 'Masukkan kode promo terlebih dahulu.' });
            return;
        }
        const promo = promoCodes.find(p => p.code === formData.promoCode.toUpperCase().trim() && p.isActive);
        if (promo) {
            setPromoFeedback({ type: 'success', message: `Promo berhasil digunakan! ${promo.discountType === 'percentage' ? promo.discountValue + '%' : 'Rp ' + promo.discountValue.toLocaleString('id-ID')}` });
        } else {
            setPromoFeedback({ type: 'error', message: 'Kode promo tidak valid atau kadaluarsa.' });
        }
    };

    return (
        <div className={`public-page-body template-wrapper template-${template} min-h-screen p-3 md:p-4 sm:p-6 lg:p-8 flex items-center justify-center`}>
            <style>{`
                .template-wrapper { background-color: var(--public-bg); color: var(--public-text-primary); }
                .template-classic .form-container { max-width: 64rem; width: 100%; margin: auto; }
                .template-modern .form-container { max-width: 72rem; width: 100%; margin: auto; display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; align-items: start; }
                .template-gallery .form-container { max-width: 56rem; width: 100%; margin: auto; }
                @media (max-width: 768px) { .template-modern .form-container { grid-template-columns: 1fr; } }
            `}</style>
            <div ref={formRef} className="form-container">
                {template === 'modern' && userProfile && (
                    <div className="p-4 sm:p-6 md:p-8 bg-public-surface rounded-2xl border border-public-border hidden md:block">
                        {userProfile?.logoBase64 ? <img src={userProfile.logoBase64} alt="logo" className="h-12 mb-4" /> : <h2 className="text-2xl font-bold text-gradient">{userProfile?.companyName}</h2>}
                        <p className="text-public-text-secondary text-sm mt-4">{userProfile?.bio}</p>
                    </div>
                )}
                
                {/* 3-Column Layout Wrapper */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left side: Main Form (spans 2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="w-full bg-public-surface rounded-2xl shadow-xl border border-public-border overflow-hidden">
                            <div className="p-6 md:p-8 bg-gradient-to-r from-public-accent/10 to-transparent border-b border-public-border">
                                <h2 className="text-xl md:text-2xl font-bold text-gradient">Buat Pemesanan Baru</h2>
                                <p className="text-public-text-secondary text-sm mt-2">Silakan lengkapi formulir di bawah ini untuk memulai booking.</p>
                                
                                {/* Progress Steps */}
                                <div className="flex items-center justify-between mt-8 relative">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-public-border rounded-full -z-10"></div>
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-public-accent transition-all duration-300 -z-10`} style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}></div>
                                    
                                    {[1, 2, 3].map((stepNumber) => (
                                        <div key={stepNumber} className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= stepNumber ? 'bg-public-accent text-white' : 'bg-public-surface border-2 border-public-border text-public-text-secondary'}`}>
                                                {stepNumber}
                                            </div>
                                            <span className={`text-xs mt-2 font-medium ${currentStep >= stepNumber ? 'text-public-accent' : 'text-public-text-secondary'}`}>
                                                {stepNumber === 1 ? 'Info Acara' : stepNumber === 2 ? 'Paket' : 'Pembayaran'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <form className="p-6 md:p-8 space-y-8" onSubmit={handleSubmit}>
                                {/* Honeypot */}
                                <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
                                
                                {/* STEP 1 */}
                                {currentStep === 1 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <h4 className="text-lg font-semibold text-gradient border-b border-public-border pb-2">1. Informasi Pengantin & Acara</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-public-text-secondary">Nama Pengantin <span className="text-red-500">*</span></label>
                                                <input type="text" name="clientName" value={formData.clientName} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-public-border bg-white/5 text-public-text-primary focus:ring-2 focus:ring-public-accent transition-all" placeholder="Misal: John & Jane" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-public-text-secondary">No. WhatsApp <span className="text-red-500">*</span></label>
                                                <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-public-border bg-white/5 text-public-text-primary focus:ring-2 focus:ring-public-accent transition-all" placeholder="08xxxxxxxxxx" required />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-public-text-secondary">Jenis Acara <span className="text-red-500">*</span></label>
                                                <select name="projectType" value={formData.projectType} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-public-border bg-public-surface text-public-text-primary focus:ring-2 focus:ring-public-accent transition-all" required>
                                                    <option value="" disabled>Pilih Jenis Acara...</option>
                                                    {userProfile?.projectTypes?.map(pt => (
                                                        <option key={pt} value={pt}>{pt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-public-text-secondary">Tanggal Acara <span className="text-red-500">*</span></label>
                                                <input type="date" name="date" value={formData.date} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-public-border bg-white/5 text-public-text-primary focus:ring-2 focus:ring-public-accent transition-all" required />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-public-text-secondary">Lokasi (Kota) <span className="text-red-500">*</span></label>
                                            <input type="text" name="location" value={formData.location} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-public-border bg-white/5 text-public-text-primary focus:ring-2 focus:ring-public-accent transition-all" placeholder="Kota pelaksanaan acara" required />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-public-text-secondary">Alamat Lengkap / Venue</label>
                                            <textarea name="address" value={formData.address || ''} onChange={handleFormChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-public-border bg-white/5 text-public-text-primary focus:ring-2 focus:ring-public-accent transition-all" placeholder="Nama gedung, jalan, detail lokasi..."></textarea>
                                        </div>
                                        
                                        <div className="pt-4 flex justify-end">
                                            <button type="button" onClick={() => validateStep1() && setCurrentStep(2)} className="button-primary flex items-center gap-2">
                                                Selanjutnya <span className="text-lg">→</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* STEP 2 */}
                                {currentStep === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <h4 className="text-lg font-semibold text-gradient border-b border-public-border pb-2">2. Pilihan Paket & Tambahan</h4>
                                        
                                        {/* Premium Package Dropdown Select */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-extrabold text-public-text-primary">Pilih Paket Layanan <span className="text-red-500">*</span></label>
                                            {isPackagesLoading ? (
                                                <div className="h-12 flex items-center justify-center border-2 border-dashed border-public-border rounded-xl">
                                                    <span className="animate-pulse text-xs text-public-text-secondary">Memuat daftar paket...</span>
                                                </div>
                                            ) : filteredPackages.length === 0 ? (
                                                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-600 text-sm">
                                                    Belum ada paket yang tersedia untuk wilayah ini.
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <select 
                                                        name="packageId" 
                                                        value={formData.packageId} 
                                                        onChange={handleFormChange} 
                                                        className="w-full px-4 py-3.5 pr-10 rounded-xl border-2 border-public-border bg-public-surface text-public-text-primary font-bold text-sm focus:ring-2 focus:ring-public-accent focus:border-public-accent transition-all cursor-pointer shadow-sm hover:border-public-accent/40 appearance-none"
                                                    >
                                                        <option value="" disabled>-- Pilih Paket Layanan --</option>
                                                        {filteredPackages.map(pkg => (
                                                            <option key={pkg.id} value={pkg.id}>
                                                                {pkg.name} — Mulai dari Rp {pkg.price.toLocaleString('id-ID')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-public-text-secondary font-bold text-sm">
                                                        ▼
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Selected Package Detail Card — compact */}
                                        {selectedPackage && (
                                            <div className="mt-3 p-4 rounded-xl bg-public-surface border border-public-accent/20 shadow-sm space-y-3 animate-in fade-in duration-300">
                                                {/* Header */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-public-text-primary">{selectedPackage.name}</span>
                                                    <span className="text-xs font-bold text-public-accent">Rp {Number(formData.unitPrice || selectedPackage.price).toLocaleString('id-ID')}</span>
                                                </div>

                                                {/* Duration pills */}
                                                {selectedPackage.durationOptions?.length ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedPackage.durationOptions.map((opt, i) => {
                                                            const isSelected = formData.durationSelection === opt.label;
                                                            return (
                                                                <button
                                                                    key={i}
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({ ...prev, durationSelection: opt.label, unitPrice: Number(opt.price) }))}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                                                        isSelected
                                                                            ? 'border-public-accent bg-public-accent text-white'
                                                                            : 'border-public-border text-public-text-secondary hover:border-public-accent/50'
                                                                    }`}
                                                                >
                                                                    {isSelected && <span className="mr-1">✓</span>}{opt.label} · Rp {Number(opt.price).toLocaleString('id-ID')}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}

                                                {/* Inclusions — inline tags */}
                                                {(() => {
                                                    const digitalItems = Array.from(new Set([...(selectedPackage.digitalItems || []), ...(selectedDurationOpt?.digitalItems || [])])).filter(Boolean);
                                                    const physicalItems = Array.from(new Set([...(selectedPackage.physicalItems || []), ...(selectedDurationOpt?.physicalItems || [])].map(i => JSON.stringify(i)))).map(s => JSON.parse(s)).filter(i => i?.name);
                                                    const teamInfo = [selectedPackage.photographers, selectedPackage.videographers].filter(Boolean).join(', ');
                                                    if (!digitalItems.length && !physicalItems.length && !teamInfo && !selectedPackage.processingTime) return null;
                                                    return (
                                                        <div className="pt-2 border-t border-public-border/30 flex flex-col gap-1">
                                                            {teamInfo && <span className="text-[10px] bg-public-bg border border-public-border/40 text-public-text-secondary px-2 py-0.5 rounded-md w-fit">{teamInfo}</span>}
                                                            {digitalItems.map((item, i) => <span key={i} className="text-[10px] bg-public-bg border border-public-border/40 text-public-text-secondary px-2 py-0.5 rounded-md w-fit">{item as string}</span>)}
                                                            {physicalItems.map((item, i) => <span key={i} className="text-[10px] bg-public-bg border border-public-border/40 text-public-text-secondary px-2 py-0.5 rounded-md w-fit">{item.name}</span>)}
                                                            {selectedPackage.processingTime && <span className="text-[10px] bg-public-accent/10 border border-public-accent/20 text-public-accent px-2 py-0.5 rounded-md w-fit">{selectedPackage.processingTime}</span>}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        
                                        {filteredAddOns.length > 0 && (
                                            <div className="space-y-2 mt-6">
                                                <label className="block text-sm font-semibold text-public-text-primary mb-3">Layanan Tambahan (Opsional)</label>
                                                <div className="space-y-3">
                                                    {filteredAddOns.map(addon => {
                                                        const isSelected = selectedAddOns.some(a => a.id === addon.id);
                                                        return (
                                                            <label 
                                                                key={addon.id} 
                                                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 shadow-sm ${
                                                                    isSelected 
                                                                        ? 'border-public-accent bg-public-accent/[0.04]' 
                                                                        : 'border-public-border hover:bg-white/5 hover:border-public-accent/40'
                                                                }`}
                                                            >
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isSelected} 
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setFormData(prev => ({ ...prev, selectedAddOnIds: [...prev.selectedAddOnIds, String(addon.id)] }));
                                                                        else setFormData(prev => ({ ...prev, selectedAddOnIds: prev.selectedAddOnIds.filter(id => id !== String(addon.id)) }));
                                                                    }} 
                                                                    className="w-5 h-5 text-public-accent rounded border-public-border focus:ring-public-accent focus:ring-2" 
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-sm text-public-text-primary">{addon.name}</div>
                                                                </div>
                                                                <div className="font-black text-sm text-public-accent">Rp {addon.price.toLocaleString('id-ID')}</div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="pt-6 flex justify-between border-t border-public-border/40">
                                            <button type="button" onClick={() => setCurrentStep(1)} className="px-6 py-3 rounded-xl font-semibold text-public-text-secondary hover:bg-white/10 transition-colors">
                                                ← Kembali
                                            </button>
                                            <button type="button" onClick={() => validateStep2() && setCurrentStep(3)} className="button-primary flex items-center gap-2">
                                                Selanjutnya <span className="text-lg">→</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* STEP 3 */}
                                {currentStep === 3 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <h4 className="text-lg font-semibold text-gradient border-b border-public-border pb-2">3. Detail Pembayaran</h4>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-public-text-secondary">Kode Promo (Opsional)</label>
                                            <div className="flex gap-2">
                                                <input type="text" name="promoCode" value={formData.promoCode || ''} onChange={handleFormChange} className="flex-1 px-4 py-3 rounded-xl border border-public-border bg-white/5 uppercase text-public-text-primary focus:ring-2 focus:ring-public-accent" placeholder="KODEPROMO" />
                                                <button type="button" onClick={handleApplyPromo} className="px-6 py-3 bg-public-surface border border-public-border rounded-xl font-medium hover:bg-white/10 transition-colors">Gunakan</button>
                                            </div>
                                            {promoFeedback.message && <p className={`text-xs mt-1 ${promoFeedback.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{promoFeedback.message}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-public-text-secondary">Metode Pembayaran DP</label>
                                            <div className="p-4 rounded-xl border border-public-border bg-white/5 space-y-3">
                                                {cards.filter(c => String(c.id) !== 'CARD_CASH').map(c => (
                                                    <div key={c.id} className="flex justify-between items-center pb-3 border-b border-public-border last:border-0 last:pb-0">
                                                        <div>
                                                            <div className="font-bold text-sm">{c.bankName}</div>
                                                            <div className="text-xs text-public-text-secondary">a.n. {c.cardHolderName}</div>
                                                        </div>
                                                        <div className="font-mono text-sm bg-public-surface px-3 py-1 rounded-md cursor-pointer hover:text-public-accent" onClick={() => { navigator.clipboard.writeText(c.lastFourDigits); showNotification && showNotification('Nomor rekening disalin'); }}>
                                                            {c.lastFourDigits} 📋
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-public-text-secondary">Nominal DP Dibayarkan <span className="text-red-500">*</span></label>
                                            <input type="number" name="dp" value={formData.dp || ''} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-public-border bg-white/5 text-public-text-primary focus:ring-2 focus:ring-public-accent" placeholder={`Saran DP: Rp ${suggestedDp.toLocaleString('id-ID')}`} required min="0" />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-public-text-secondary">Bukti Transfer (Opsional)</label>
                                            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full px-4 py-2 rounded-xl border border-public-border bg-white/5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-public-accent file:text-white hover:file:bg-public-accent/80 transition-all" />
                                            {paymentProofPreview && (
                                                <div className="mt-2"><img src={paymentProofPreview} alt="Preview Bukti Bayar" className="h-32 object-contain rounded-lg border border-public-border" /></div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="flex items-start gap-3 p-3 rounded-xl border border-public-border bg-white/5 cursor-pointer">
                                                <input type="checkbox" required className="mt-1 w-4 h-4 text-public-accent rounded focus:ring-public-accent" />
                                                <span className="text-xs text-public-text-secondary">
                                                    Saya menyetujui <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-public-accent hover:underline">Syarat & Ketentuan</button> yang berlaku.
                                                </span>
                                            </label>
                                        </div>
                                        
                                        <div className="pt-4 flex justify-between">
                                            <button type="button" onClick={() => setCurrentStep(2)} className="px-6 py-3 rounded-xl font-medium text-public-text-secondary hover:bg-white/10 transition-colors">
                                                ← Kembali
                                            </button>
                                            <button type="submit" disabled={isSubmitting} className="button-primary flex items-center gap-2">
                                                {isSubmitting ? 'Memproses...' : 'Kirim Booking'} <span className="text-lg">✓</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                    
                    {/* Right side: Sticky Summary (Desktop Only, but hidden on mobile) */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-8 bg-public-surface rounded-2xl shadow-xl border border-public-border overflow-hidden">
                            <div className="p-6 bg-gradient-to-r from-public-accent/10 to-transparent border-b border-public-border">
                                <h3 className="text-lg font-bold text-gradient">Ringkasan Biaya</h3>
                            </div>
                            <div className="p-6 space-y-4 text-sm">
                                <div className="flex justify-between items-start">
                                    <span className="text-public-text-secondary">Paket:</span>
                                    <span className="font-semibold text-right max-w-[60%]">
                                        {filteredPackages.find(p => String(p.id) === String(formData.packageId))?.name || '-'}
                                        {formData.durationSelection && <span className="block text-xs font-normal text-public-text-secondary mt-1">({formData.durationSelection})</span>}
                                    </span>
                                </div>
                                
                                {selectedAddOns.length > 0 && (
                                    <div className="border-t border-public-border pt-4">
                                        <span className="text-public-text-secondary block mb-2">Tambahan:</span>
                                        {selectedAddOns.map(a => (
                                            <div key={a.id} className="flex justify-between text-xs mb-1">
                                                <span>{a.name}</span>
                                                <span>Rp {a.price.toLocaleString('id-ID')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="border-t border-public-border pt-4 flex justify-between font-semibold">
                                    <span>Subtotal:</span>
                                    <span>Rp {totalBeforeDiscount.toLocaleString('id-ID')}</span>
                                </div>
                                
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-green-500">
                                        <span>Diskon {discountText}:</span>
                                        <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                
                                <div className="border-t-2 border-public-border pt-4 flex justify-between items-center mt-4">
                                    <span className="font-bold text-base">Total Tagihan:</span>
                                    <span className="font-bold text-lg text-public-accent">Rp {totalProject.toLocaleString('id-ID')}</span>
                                </div>
                                
                                <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <span className="block text-xs text-blue-500 mb-1">Saran DP (30%):</span>
                                    <span className="font-bold text-blue-600 text-sm">Rp {suggestedDp.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Modals */}
                <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} title="Syarat dan Ketentuan">
                    {formattedTerms ? (
                        <div className="space-y-2">{formattedTerms}</div>
                    ) : (
                        <p className="text-public-text-secondary text-center py-8">Syarat dan ketentuan umum belum diatur oleh vendor.</p>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default PublicBookingForm;
