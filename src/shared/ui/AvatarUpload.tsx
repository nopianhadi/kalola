import React from "react";

// ─── Helper: kompres + crop square ke base64 ─────────────────────────────────
export function compressAvatarImage(
    file: File,
    maxSize: number = 256,
    quality: number = 0.85
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const size = Math.min(img.width, img.height, maxSize);
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                if (!ctx) { reject(new Error("canvas context failed")); return; }
                // Center-crop square
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = () => reject(new Error("Gagal memuat gambar"));
        };
        reader.onerror = () => reject(new Error("Gagal membaca file"));
    });
}

// ─── AvatarDisplay: tampil avatar atau fallback inisial ─────────────────────
export interface AvatarDisplayProps {
    avatarBase64?: string | null;
    name: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
    variant?: "client" | "team" | "vendor";
}

const sizeStyles: Record<string, string> = {
    xs:  "w-6  h-6  text-[8px]",
    sm:  "w-8  h-8  text-[10px]",
    md:  "w-10 h-10 text-xs",
    lg:  "w-16 h-16 text-xl",
    xl:  "w-28 h-28 text-3xl",
};

const gradientStyles: Record<string, string> = {
    client: "from-pink-500 to-rose-600",
    team:   "from-indigo-500 to-blue-600",
    vendor: "from-purple-500 to-violet-600",
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
    avatarBase64,
    name,
    size = "md",
    className = "",
    variant = "team",
}) => {
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const baseClass = `relative shrink-0 overflow-hidden rounded-2xl ${sizeStyles[size]} ${className}`;

    if (avatarBase64) {
        return (
            <div className={baseClass}>
                <img
                    src={avatarBase64}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={`${baseClass} bg-gradient-to-br ${gradientStyles[variant]} flex items-center justify-center text-white font-black shadow-sm`}
        >
            {initials}
        </div>
    );
};

// ─── AvatarUpload: klik untuk upload, kompres, simpan ─────────────────────────
export interface AvatarUploadProps {
    value?: string | null;
    onChange: (base64: string | null) => void;
    name: string;
    size?: "md" | "lg" | "xl";
    variant?: "client" | "team" | "vendor";
    disabled?: boolean;
    label?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
    value,
    onChange,
    name,
    size = "xl",
    variant = "team",
    disabled = false,
    label = "Foto Profil",
}) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const containerSizeClass: Record<string, string> = {
        md: "w-16 h-16",
        lg: "w-20 h-20",
        xl: "w-28 h-28",
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Hanya file gambar yang diperbolehkan.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Ukuran file maksimal 5MB.");
            return;
        }

        setIsLoading(true);
        try {
            const compressed = await compressAvatarImage(file, 256, 0.85);
            // Panggil onChange dengan base64 — parent harus simpan ke backend
            await Promise.resolve(onChange(compressed));
        } catch (err) {
            console.error("[AvatarUpload] Gagal proses/simpan gambar:", err);
            alert("Gagal memproses gambar. Coba lagi.");
        } finally {
            setIsLoading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const triggerUpload = () => {
        if (!disabled && !isLoading) inputRef.current?.click();
    };

    const gradientFallback = gradientStyles[variant];
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">
                {label}
            </p>

            <div
                className={`relative group ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                onClick={triggerUpload}
            >
                {/* Avatar display */}
                <div
                    className={`${containerSizeClass[size]} rounded-3xl overflow-hidden border-2 border-brand-border transition-all ${!disabled ? "group-hover:border-brand-accent/50" : ""} ${isLoading ? "animate-pulse" : ""}`}
                >
                    {value ? (
                        <img
                            src={value}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div
                            className={`w-full h-full bg-gradient-to-br ${gradientFallback} flex items-center justify-center text-white font-black shadow-xl text-3xl`}
                        >
                            {initials}
                        </div>
                    )}
                </div>

                {/* Hover overlay kamera */}
                {!disabled && (
                    <div className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg
                                className="w-7 h-7 text-white drop-shadow-lg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        )}
                    </div>
                )}

                {/* Badge hapus foto */}
                {value && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors shadow-lg z-10 leading-none"
                        title="Hapus foto"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isLoading}
            />

            <p className="text-[10px] text-brand-text-secondary text-center leading-relaxed">
                {value ? "Klik untuk ganti foto" : "Klik untuk upload foto"}
                <br />
                <span className="opacity-60">JPG/PNG/WEBP · maks 5MB</span>
            </p>
        </div>
    );
};

export default AvatarUpload;
