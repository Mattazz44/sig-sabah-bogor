@php
    $initialFeedbackType = session('admin_feedback_type');
    $initialFeedbackMessage = session('success');
@endphp

<style>
    @keyframes amfToastIn {
        0% {
            opacity: 0;
            transform: translate3d(0, -12px, 0) scale(0.97);
        }
        100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
        }
    }

    @keyframes amfModalIn {
        0% {
            opacity: 0;
            transform: translate3d(0, 10px, 0) scale(0.95);
        }
        100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
        }
    }

    @keyframes amfMascotBounce {
        0% {
            opacity: 0;
            transform: translateY(8px) scale(0.86);
        }
        55% {
            opacity: 1;
            transform: translateY(-5px) scale(1.06);
        }
        80% {
            transform: translateY(1px) scale(0.98);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    @keyframes amfMascotShake {
        0%, 100% {
            transform: translateX(0) rotate(0deg);
        }
        20% {
            transform: translateX(-4px) rotate(-3deg);
        }
        40% {
            transform: translateX(4px) rotate(3deg);
        }
        60% {
            transform: translateX(-2.5px) rotate(-1.5deg);
        }
        80% {
            transform: translateX(2px) rotate(1deg);
        }
    }

    @keyframes amfMascotWave {
        0% {
            opacity: 0;
            transform: scale(0.9) rotate(-6deg);
        }
        35% {
            opacity: 1;
            transform: scale(1.02) rotate(4deg);
        }
        65% {
            transform: scale(1) rotate(-3deg);
        }
        100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
        }
    }

    @keyframes amfMascotFade {
        0% {
            opacity: 0;
            transform: translateY(6px) scale(0.94);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    @keyframes amfProgressShrink {
        from {
            transform: scaleX(1);
        }
        to {
            transform: scaleX(0);
        }
    }

    .amf-toast-card {
        animation: amfToastIn 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .amf-modal-card {
        animation: amfModalIn 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .amf-motion-bounce {
        animation: amfMascotBounce 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .amf-motion-shake {
        animation: amfMascotShake 560ms ease-in-out both;
    }

    .amf-motion-wave {
        animation: amfMascotWave 650ms ease-in-out both;
    }

    .amf-motion-fade {
        animation: amfMascotFade 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .amf-progress-bar {
        transform-origin: left center;
        animation: amfProgressShrink var(--amf-duration, 3000ms) linear forwards;
    }

    .amf-toast-card.is-paused .amf-progress-bar {
        animation-play-state: paused;
    }

    @media (prefers-reduced-motion: reduce) {
        .amf-toast-card,
        .amf-modal-card,
        .amf-motion-bounce,
        .amf-motion-shake,
        .amf-motion-wave,
        .amf-motion-fade,
        .amf-progress-bar {
            animation: none !important;
        }
    }
</style>

<!-- Komponen Terpadu AdminMascotFeedback: Toast Otomatis + Modal Konfirmasi -->
<div
    id="admin-mascot-feedback-root"
    data-initial-type="{{ $initialFeedbackType ?? '' }}"
    data-initial-message="{{ $initialFeedbackMessage ?? '' }}"
>
    <!-- 1. Slot Tunggal Toast (Non-stacking, z-index tinggi di atas navbar & header) -->
    <div
        id="admin-mascot-toast-slot"
        class="pointer-events-none fixed inset-x-4 top-4 z-[90] mx-auto max-w-[420px] sm:left-auto sm:right-5 sm:mx-0 sm:w-[400px]"
        style="padding-top: env(safe-area-inset-top, 0px);"
        aria-live="polite"
    ></div>

    <!-- 2. Modal Konfirmasi Terpusat (Logout & Hapus Data Wisata) -->
    <div
        id="admin-mascot-modal-backdrop"
        class="fixed inset-0 z-[95] hidden items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-md"
        aria-hidden="true"
    >
        <div
            id="admin-mascot-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-mascot-modal-title"
            aria-describedby="admin-mascot-modal-desc"
            class="amf-modal-card relative max-h-[calc(100dvh-2rem)] w-full max-w-[400px] overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-b from-[#1B241C]/95 to-[#121813]/95 p-6 text-center text-[#F5F2EB] shadow-[0_26px_54px_-16px_rgba(0,0,0,0.68)] backdrop-blur-2xl"
        >
            <div class="relative mx-auto mb-4 flex justify-center">
                <div
                    id="admin-mascot-modal-frame"
                    class="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-[#76937A]/30 bg-[#1E2B20]"
                >
                    <img
                        id="admin-mascot-modal-img"
                        src="/assets/mascot/mascot-goodbye.svg"
                        alt="Maskot Admin Sabah Bogor"
                        width="96"
                        height="96"
                        loading="eager"
                        decoding="async"
                        draggable="false"
                        class="h-full w-full object-contain p-1"
                    />
                </div>
                <span
                    id="admin-mascot-modal-alert-badge"
                    aria-hidden="true"
                    class="hidden absolute -bottom-1.5 right-[calc(50%-3.2rem)] h-7 w-7 items-center justify-center rounded-full border border-rose-300/40 bg-[#4A1C24] text-rose-200 shadow-sm"
                >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </span>
            </div>

            <h2
                id="admin-mascot-modal-title"
                class="text-[17.5px] font-bold leading-snug tracking-tight text-[#F5F2EB]"
            ></h2>

            <div
                id="admin-mascot-modal-item-wrap"
                class="mt-2.5 hidden justify-center"
            >
                <span
                    id="admin-mascot-modal-item"
                    class="inline-flex max-w-full truncate rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1 text-[12.5px] font-semibold text-[#F2ECE1]"
                ></span>
            </div>

            <p
                id="admin-mascot-modal-desc"
                class="mt-2.5 text-[13px] leading-relaxed text-[#F5F2EB]/75"
            ></p>

            <div class="mt-6 grid grid-cols-2 gap-3">
                <button
                    type="button"
                    id="admin-mascot-modal-cancel"
                    class="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 text-[13px] font-semibold text-[#F5F2EB] transition-colors hover:bg-white/[0.12] active:scale-[0.98] disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    type="button"
                    id="admin-mascot-modal-confirm"
                    class="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-rose-300/35 bg-[#9E2B37] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#B53442] active:scale-[0.98] disabled:opacity-60"
                >
                    Lanjutkan
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    (function () {
        const CONFIG = {
            'save-success': {
                mode: 'toast',
                asset: '/assets/mascot/mascot-happy.svg',
                alt: 'Maskot Rusa Tutul bahagia setelah perubahan tersimpan',
                motionClass: 'amf-motion-bounce',
                cardClass: 'border-emerald-300/30 bg-gradient-to-br from-[#1A2B1F]/95 to-[#131C15]/95',
                frameClass: 'border-emerald-300/25 bg-[#1E3324]',
                titleClass: 'text-emerald-200',
                progressClass: 'bg-emerald-300/70',
                title: 'Perubahan berhasil disimpan!',
                defaultDetail: 'Data destinasi wisata telah diperbarui di database.',
                duration: 3000,
                role: 'status',
            },
            'filter-unsaved': {
                mode: 'toast',
                asset: '/assets/mascot/mascot-confused.svg',
                alt: 'Maskot Rusa Tutul mengingatkan filter belum disimpan',
                motionClass: 'amf-motion-shake',
                cardClass: 'border-[#DFAA63]/40 bg-gradient-to-br from-[#2A2316]/95 to-[#161914]/95',
                frameClass: 'border-[#DFAA63]/30 bg-[#312819]',
                titleClass: 'text-[#DFAA63]',
                progressClass: 'bg-[#DFAA63]/75',
                title: 'Filter tidak disimpan',
                defaultDetail: 'Perubahan pencarian atau kategori belum diterapkan.',
                duration: 6000,
                role: 'alert',
            },
            'delete-success': {
                mode: 'toast',
                asset: '/assets/mascot/mascot-default.svg',
                alt: 'Maskot Rusa Tutul setelah data wisata berhasil dihapus',
                motionClass: 'amf-motion-fade',
                cardClass: 'border-[#76937A]/35 bg-gradient-to-br from-[#1B251E]/95 to-[#131915]/95',
                frameClass: 'border-[#76937A]/30 bg-[#212E24]',
                titleClass: 'text-[#A9C2AD]',
                progressClass: 'bg-[#76937A]/75',
                title: 'Data wisata berhasil dihapus.',
                defaultDetail: 'Destinasi telah dihapus dari database wisata Bogor.',
                duration: 3000,
                role: 'status',
            },
            'confirm-logout': {
                mode: 'modal',
                asset: '/assets/mascot/mascot-goodbye.svg',
                alt: 'Maskot Rusa Tutul melambaikan tangan perpisahan',
                motionClass: 'amf-motion-wave',
                dialogClass: 'border-white/15 bg-gradient-to-b from-[#1B241C]/95 to-[#121813]/95',
                frameClass: 'border-[#76937A]/30 bg-[#1E2B20]',
                confirmBtnClass: 'border-[#DFAA63]/35 bg-[#3D2428] text-rose-100 hover:bg-[#502C32]',
                showAlertBadge: false,
                title: 'Kamu yakin ingin keluar dari halaman Admin?',
                defaultDetail: 'Sesi administrator Anda akan diakhiri dan Anda perlu masuk kembali untuk mengelola data wisata.',
                confirmLabel: 'Ya, Keluar',
                busyLabel: 'Keluar...',
                cancelLabel: 'Batal',
            },
            'confirm-delete-wisata': {
                mode: 'modal',
                asset: '/assets/mascot/mascot-confused.svg',
                alt: 'Maskot Rusa Tutul memperingatkan penghapusan data wisata',
                motionClass: 'amf-motion-shake',
                dialogClass: 'border-rose-300/30 bg-gradient-to-b from-[#23181A]/95 to-[#141714]/95',
                frameClass: 'border-rose-300/30 bg-[#2E1B1F]',
                confirmBtnClass: 'border-rose-300/35 bg-[#9E2B37] text-white hover:bg-[#B53442]',
                showAlertBadge: true,
                title: 'Hapus data wisata ini?',
                defaultDetail: 'Yakin ingin menghapus data wisata ini? Tindakan ini tidak bisa dibatalkan.',
                confirmLabel: 'Hapus Data',
                busyLabel: 'Menghapus...',
                cancelLabel: 'Batal',
            },
        };

        const root = document.getElementById('admin-mascot-feedback-root');
        const toastSlot = document.getElementById('admin-mascot-toast-slot');
        const modalBackdrop = document.getElementById('admin-mascot-modal-backdrop');
        const modalDialog = document.getElementById('admin-mascot-modal-dialog');
        const modalFrame = document.getElementById('admin-mascot-modal-frame');
        const modalImg = document.getElementById('admin-mascot-modal-img');
        const modalAlertBadge = document.getElementById('admin-mascot-modal-alert-badge');
        const modalTitle = document.getElementById('admin-mascot-modal-title');
        const modalItemWrap = document.getElementById('admin-mascot-modal-item-wrap');
        const modalItem = document.getElementById('admin-mascot-modal-item');
        const modalDesc = document.getElementById('admin-mascot-modal-desc');
        const modalCancelBtn = document.getElementById('admin-mascot-modal-cancel');
        const modalConfirmBtn = document.getElementById('admin-mascot-modal-confirm');

        if (!root || !toastSlot || !modalBackdrop) return;

        let activeTimer = null;
        let activeConfirmHandler = null;
        let isBusy = false;
        let remainingMs = 0;
        let startedAt = 0;
        let lastTriggerEl = null;

        function clearTimer() {
            if (activeTimer) {
                window.clearTimeout(activeTimer);
                activeTimer = null;
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text == null ? '' : String(text);
            return div.innerHTML;
        }

        function clearToast() {
            clearTimer();
            toastSlot.innerHTML = '';
        }

        function closeModal(restoreFocus) {
            if (isBusy) return;
            activeConfirmHandler = null;
            modalBackdrop.classList.add('hidden');
            modalBackdrop.classList.remove('flex');
            modalBackdrop.setAttribute('aria-hidden', 'true');
            modalBackdrop.removeAttribute('data-feedback-type');
            if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
                lastTriggerEl.focus();
            }
            lastTriggerEl = null;
        }

        function dismissAll() {
            clearToast();
            closeModal(true);
        }

        function startToastTimer(durationMs) {
            clearTimer();
            if (!durationMs || durationMs <= 0) return;
            remainingMs = durationMs;
            startedAt = Date.now();
            activeTimer = window.setTimeout(clearToast, remainingMs);
        }

        function showToast(type, options) {
            const cfg = CONFIG[type];
            if (!cfg || cfg.mode !== 'toast') return;
            const opts = options || {};

            // Non-stacking: tutup modal/toast sebelumnya sebelum menampilkan yang baru
            closeModal(false);
            clearToast();

            const title = opts.title || cfg.title;
            const detail = opts.detail !== undefined ? opts.detail : cfg.defaultDetail;
            const duration = opts.duration !== undefined ? opts.duration : cfg.duration;
            const saveLabel = opts.saveLabel || 'Simpan Ulang';
            const showFilterActions = type === 'filter-unsaved';

            const card = document.createElement('div');
            card.id = 'admin-mascot-toast';
            card.dataset.feedbackType = type;
            card.setAttribute('role', cfg.role);
            card.className =
                'amf-toast-card pointer-events-auto relative overflow-hidden rounded-2xl border p-3.5 text-[#F5F2EB] shadow-[0_18px_38px_-14px_rgba(0,0,0,0.6)] backdrop-blur-xl ' +
                cfg.cardClass;

            card.innerHTML =
                '<div class="flex items-start gap-3">' +
                    '<div class="' + cfg.motionClass + ' flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border ' + cfg.frameClass + '">' +
                        '<img src="' + cfg.asset + '" alt="' + escapeHtml(cfg.alt) + '" width="56" height="56" loading="eager" decoding="async" draggable="false" class="h-full w-full object-contain p-0.5" />' +
                    '</div>' +
                    '<div class="min-w-0 flex-1 pt-0.5">' +
                        '<p class="text-[13.5px] font-bold leading-snug tracking-tight ' + cfg.titleClass + '">' + escapeHtml(title) + '</p>' +
                        (detail ? '<p class="mt-0.5 text-[12px] leading-relaxed text-[#F5F2EB]/80">' + escapeHtml(detail) + '</p>' : '') +
                        (showFilterActions
                            ? '<div class="mt-2.5 flex flex-wrap items-center gap-2">' +
                                (typeof opts.onSaveFilter === 'function'
                                    ? '<button type="button" data-amf-save-filter class="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-[#DFAA63]/45 bg-[#DFAA63]/20 px-3 text-[12px] font-semibold text-[#F5E6C8] transition-colors hover:bg-[#DFAA63]/30 active:scale-[0.98]">' + escapeHtml(saveLabel) + '</button>'
                                    : '') +
                                '<button type="button" data-amf-dismiss class="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 text-[12px] font-medium text-[#F5F2EB]/80 transition-colors hover:bg-white/[0.12] hover:text-[#F5F2EB] active:scale-[0.98]">Tutup</button>' +
                              '</div>'
                            : '') +
                    '</div>' +
                    '<button type="button" data-amf-dismiss aria-label="Tutup notifikasi" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#F5F2EB]/65 transition-colors hover:bg-white/[0.1] hover:text-[#F5F2EB]">' +
                        '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
                    '</button>' +
                '</div>' +
                (duration > 0
                    ? '<div aria-hidden="true" class="absolute inset-x-0 bottom-0 h-[2.5px] bg-white/[0.06]"><div class="amf-progress-bar h-full w-full ' + cfg.progressClass + '" style="--amf-duration:' + duration + 'ms;"></div></div>'
                    : '');

            card.querySelectorAll('[data-amf-dismiss]').forEach(function (btn) {
                btn.addEventListener('click', clearToast);
            });

            const saveFilterBtn = card.querySelector('[data-amf-save-filter]');
            if (saveFilterBtn && typeof opts.onSaveFilter === 'function') {
                saveFilterBtn.addEventListener('click', function () {
                    const handler = opts.onSaveFilter;
                    clearToast();
                    handler();
                });
            }

            if (duration > 0) {
                const pause = function () {
                    if (!activeTimer) return;
                    clearTimer();
                    remainingMs = Math.max(400, remainingMs - (Date.now() - startedAt));
                    card.classList.add('is-paused');
                };
                const resume = function () {
                    if (!card.isConnected) return;
                    card.classList.remove('is-paused');
                    startToastTimer(remainingMs);
                };
                card.addEventListener('mouseenter', pause);
                card.addEventListener('mouseleave', resume);
                card.addEventListener('focusin', pause);
                card.addEventListener('focusout', resume);
            }

            toastSlot.appendChild(card);
            startToastTimer(duration);
        }

        function showConfirm(type, options) {
            const cfg = CONFIG[type];
            if (!cfg || cfg.mode !== 'modal') return;
            const opts = options || {};

            // Non-stacking: bersihkan toast aktif saat modal konfirmasi terbuka
            clearToast();
            isBusy = false;
            lastTriggerEl = document.activeElement;
            activeConfirmHandler = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;

            modalDialog.className =
                'amf-modal-card relative max-h-[calc(100dvh-2rem)] w-full max-w-[400px] overflow-y-auto rounded-3xl border p-6 text-center text-[#F5F2EB] shadow-[0_26px_54px_-16px_rgba(0,0,0,0.68)] backdrop-blur-2xl ' +
                cfg.dialogClass;

            modalFrame.className =
                cfg.motionClass + ' relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border ' +
                cfg.frameClass;

            modalImg.src = cfg.asset;
            modalImg.alt = cfg.alt;

            if (cfg.showAlertBadge) {
                modalAlertBadge.classList.remove('hidden');
                modalAlertBadge.classList.add('flex');
            } else {
                modalAlertBadge.classList.add('hidden');
                modalAlertBadge.classList.remove('flex');
            }

            modalTitle.textContent = opts.title || cfg.title;
            modalDesc.textContent = opts.detail || cfg.defaultDetail;

            if (opts.itemName) {
                modalItem.textContent = opts.itemName;
                modalItemWrap.classList.remove('hidden');
                modalItemWrap.classList.add('flex');
            } else {
                modalItem.textContent = '';
                modalItemWrap.classList.add('hidden');
                modalItemWrap.classList.remove('flex');
            }

            modalCancelBtn.disabled = false;
            modalCancelBtn.textContent = opts.cancelLabel || cfg.cancelLabel;

            modalConfirmBtn.disabled = false;
            modalConfirmBtn.className =
                'inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-[13px] font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 ' +
                cfg.confirmBtnClass;
            modalConfirmBtn.textContent = opts.confirmLabel || cfg.confirmLabel;
            modalConfirmBtn.dataset.busyLabel = opts.busyLabel || cfg.busyLabel;

            modalBackdrop.dataset.feedbackType = type;
            modalBackdrop.classList.remove('hidden');
            modalBackdrop.classList.add('flex');
            modalBackdrop.setAttribute('aria-hidden', 'false');

            window.requestAnimationFrame(function () {
                modalCancelBtn.focus();
            });
        }

        modalCancelBtn.addEventListener('click', function () {
            closeModal(true);
        });

        modalBackdrop.addEventListener('click', function (e) {
            if (e.target === modalBackdrop) {
                closeModal(true);
            }
        });

        modalConfirmBtn.addEventListener('click', function () {
            if (isBusy) return;
            isBusy = true;
            modalCancelBtn.disabled = true;
            modalConfirmBtn.disabled = true;
            modalConfirmBtn.textContent = modalConfirmBtn.dataset.busyLabel || 'Memproses...';
            if (typeof activeConfirmHandler === 'function') {
                activeConfirmHandler();
            }
        });

        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (!modalBackdrop.classList.contains('hidden')) {
                    closeModal(true);
                } else if (toastSlot.children.length > 0) {
                    clearToast();
                }
            }
        });

        // Ekspor API terpadu untuk seluruh halaman Admin
        window.AdminMascotFeedback = {
            showToast: showToast,
            showConfirm: showConfirm,
            dismiss: dismissAll,
        };

        // 1. Auto-trigger Toast dari Laravel Flash Session (save-success / delete-success)
        const initialType = (root.dataset.initialType || '').trim();
        const initialMessage = (root.dataset.initialMessage || '').trim();
        if (initialType && CONFIG[initialType] && CONFIG[initialType].mode === 'toast') {
            showToast(initialType, {
                detail: initialMessage || CONFIG[initialType].defaultDetail,
            });
        }

        // 2. Intercept Logout Form -> Modal Konfirmasi Keluar (confirm-logout)
        document.querySelectorAll('[data-admin-logout-form]').forEach(function (form) {
            form.addEventListener('submit', function (e) {
                if (form.dataset.amfConfirmed === '1') return;
                e.preventDefault();
                showConfirm('confirm-logout', {
                    onConfirm: function () {
                        form.dataset.amfConfirmed = '1';
                        form.submit();
                    },
                });
            });
        });

        // 3. Intercept Form Hapus Data Wisata -> Modal Konfirmasi Hapus (confirm-delete-wisata)
        document.querySelectorAll('[data-admin-delete-form]').forEach(function (form) {
            form.addEventListener('submit', function (e) {
                if (form.dataset.amfConfirmed === '1') return;
                e.preventDefault();
                const spotName = form.dataset.spotName || '';
                showConfirm('confirm-delete-wisata', {
                    itemName: spotName,
                    onConfirm: function () {
                        form.dataset.amfConfirmed = '1';
                        form.submit();
                    },
                });
            });
        });

        // 4. Deteksi Filter Tidak Tersimpan pada Toolbar Pencarian & Kategori (#admin-filter-form)
        const filterForm = document.getElementById('admin-filter-form');
        const searchInput = document.getElementById('admin-search-q');
        const searchSubmitBtn = document.getElementById('admin-search-submit');
        const categoryHiddenInput = document.getElementById('admin-filter-category-input');

        if (filterForm && searchInput) {
            const appliedQuery = (searchInput.dataset.appliedQuery || '').trim();
            let pendingCategoryOverride = null;

            function isSearchDirty() {
                return searchInput.value.trim() !== appliedQuery;
            }

            function syncFilterDirtyIndicator() {
                const dirty = isSearchDirty();
                if (searchSubmitBtn) {
                    searchSubmitBtn.classList.toggle('border-[#DFAA63]/55', dirty);
                    searchSubmitBtn.classList.toggle('text-[#F5E6C8]', dirty);
                    searchSubmitBtn.dataset.unsaved = dirty ? 'true' : 'false';
                }
            }

            searchInput.addEventListener('input', syncFilterDirtyIndicator);

            filterForm.addEventListener('submit', function () {
                clearToast();
            });

            // Jika admin mengetik filter baru lalu berpindah fokus ke luar toolbar tanpa klik "Cari"
            filterForm.addEventListener('focusout', function (e) {
                if (!isSearchDirty()) return;
                const nextFocus = e.relatedTarget;
                if (nextFocus && filterForm.contains(nextFocus)) return;
                if (nextFocus && toastSlot.contains(nextFocus)) return;
                if (nextFocus && nextFocus.closest && nextFocus.closest('[data-admin-category-pill]')) return;

                showToast('filter-unsaved', {
                    detail: 'Kata kunci pencarian baru belum diterapkan ke daftar wisata.',
                    saveLabel: 'Simpan Ulang',
                    onSaveFilter: function () {
                        if (pendingCategoryOverride && categoryHiddenInput) {
                            categoryHiddenInput.value = pendingCategoryOverride;
                        }
                        filterForm.submit();
                    },
                });
            });

            // Jika admin klik pill kategori saat kotak pencarian memiliki perubahan belum disimpan
            document.querySelectorAll('[data-admin-category-pill]').forEach(function (pill) {
                pill.addEventListener('click', function (e) {
                    if (!isSearchDirty()) return;
                    e.preventDefault();
                    const chosenCat = pill.dataset.categoryValue || 'Semua';
                    pendingCategoryOverride = chosenCat;
                    showToast('filter-unsaved', {
                        detail: 'Pencarian "' + searchInput.value.trim() + '" belum diterapkan sebelum berganti kategori.',
                        saveLabel: 'Terapkan Filter',
                        onSaveFilter: function () {
                            if (categoryHiddenInput) {
                                categoryHiddenInput.value = chosenCat;
                            }
                            filterForm.submit();
                        },
                    });
                });
            });
        }
    })();
</script>
