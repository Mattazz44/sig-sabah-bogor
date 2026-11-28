import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiFetch } from '../../utils/api'
import { translateKey, usePreferences } from '../../utils/preferences'
import {
  AlertTriangleIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  LockIcon,
  LogOutIcon,
  RouteWaypointsIcon,
  XIcon,
} from './VectorIcons'

function ProfileSettingsSheet({
  isOpen,
  initialSection = 'menu',
  onClose,
  profileName = '',
  profileBio = '',
  onProfileSaved,
  onRequestLogout,
  onNotify,
}) {
  const {
    language,
    distanceUnit,
    routeNotifications,
    setLanguage,
    setDistanceUnit,
    setRouteNotifications,
    t,
  } = usePreferences()

  const [section, setSection] = useState(initialSection)
  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [prevInitialSection, setPrevInitialSection] = useState(initialSection)

  // Edit Profile form state
  const [nameInput, setNameInput] = useState(profileName)
  const [bioInput, setBioInput] = useState(profileBio)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const closeBtnRef = useRef(null)

  if (isOpen !== prevOpen || (isOpen && initialSection !== prevInitialSection)) {
    setPrevOpen(isOpen)
    setPrevInitialSection(initialSection)
    if (isOpen) {
      setSection(initialSection || 'menu')
      setNameInput(profileName || '')
      setBioInput(profileBio || '')
      setProfileError('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      setShowCurrentPw(false)
      setShowNewPw(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const raf = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus()
    })
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (section !== 'menu' && initialSection === 'menu') {
          setSection('menu')
        } else {
          onClose?.()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, section, initialSection, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleLanguageSwitch = (nextLang) => {
    if (nextLang === language) return
    setLanguage(nextLang)
    onNotify?.(translateKey(nextLang, 'toast.languageChanged'))
  }

  const handleDistanceUnitSwitch = (nextUnit) => {
    if (nextUnit === distanceUnit) return
    setDistanceUnit(nextUnit)
    onNotify?.(
      nextUnit === 'mi' ? t('toast.distanceUnitChangedMi') : t('toast.distanceUnitChangedKm'),
    )
  }

  const handleToggleRouteNotifications = () => {
    const nextVal = !routeNotifications
    setRouteNotifications(nextVal)
    onNotify?.(nextVal ? t('toast.routeNotifOn') : t('toast.routeNotifOff'))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const trimmedName = nameInput.trim()
    const trimmedBio = bioInput.trim()

    if (trimmedName.length < 2) {
      setProfileError(t('settings.nameRequired'))
      return
    }

    setIsSavingProfile(true)
    setProfileError('')

    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, bio: trimmedBio }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message || t('settings.profileSaveFailed'))
      }

      onProfileSaved?.(json?.data || { name: trimmedName, bio: trimmedBio })
      onNotify?.(t('toast.profileUpdated'))
      if (initialSection === 'edit-profile') {
        onClose?.()
      } else {
        setSection('menu')
      }
    } catch (err) {
      setProfileError(err?.message || t('settings.profileSaveFailed'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      setPasswordError(t('settings.currentPasswordRequired'))
      return
    }
    if (newPassword.length < 6) {
      setPasswordError(t('settings.passwordMinError'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwordMismatch'))
      return
    }

    setIsSavingPassword(true)
    setPasswordError('')

    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message || t('settings.passwordSaveFailed'))
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onNotify?.(t('toast.passwordUpdated'))
      setSection('menu')
    } catch (err) {
      setPasswordError(err?.message || t('settings.passwordSaveFailed'))
    } finally {
      setIsSavingPassword(false)
    }
  }

  const headerTitle =
    section === 'edit-profile'
      ? t('settings.editProfileTitle')
      : section === 'change-password'
        ? t('settings.changePasswordTitle')
        : t('settings.title')

  const showSubBack = section !== 'menu' && initialSection === 'menu'

  const inputClass =
    'min-h-[44px] w-full rounded-xl border border-[#F2ECE1]/12 bg-[#0E1410] px-3.5 py-2.5 text-[13.5px] text-[#F5F2EB] placeholder:text-[#F5F2EB]/35 transition-colors focus:border-[#8FB596]/60 focus:outline-none'

  return createPortal(
    <div
      id="profile-settings-overlay"
      onClick={onClose}
      className="fixed inset-0 z-[2050] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4 animate-backdrop-fade"
    >
      <div
        id="profile-settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-[#F2ECE1]/10 bg-[#121814] text-[#F5F2EB] shadow-[0_-18px_48px_rgba(0,0,0,0.55)] sm:max-h-[84dvh] sm:max-w-[460px] sm:rounded-3xl sm:shadow-[0_28px_60px_-14px_rgba(0,0,0,0.68)] animate-modal-pop"
      >
        {/* Drag Indicator khusus Mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-[#F2ECE1]/20" />
        </div>

        {/* Header Sheet */}
        <div className="flex items-center justify-between gap-3 border-b border-[#F2ECE1]/[0.08] px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            {showSubBack && (
              <button
                type="button"
                id="btn-settings-sub-back"
                onClick={() => setSection('menu')}
                aria-label={t('common.back')}
                className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#F5F2EB]/75 transition-colors hover:bg-white/[0.08] hover:text-[#F5F2EB]"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}
            <h2
              id="profile-settings-title"
              className="truncate text-[17px] font-bold tracking-[-0.015em] text-[#F5F2EB]"
            >
              {headerTitle}
            </h2>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            id="btn-close-settings"
            onClick={onClose}
            aria-label={t('settings.closeAria')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#F5F2EB]/75 transition-colors hover:bg-white/[0.12] hover:text-[#F5F2EB] active:scale-[0.96]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body Konten Scrollable */}
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {section === 'menu' && (
            <div className="space-y-6">
              {/* A. BAHASA APLIKASI */}
              <section aria-labelledby="settings-heading-language">
                <h3
                  id="settings-heading-language"
                  className="mb-2.5 px-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#F5F2EB]/45"
                >
                  {t('settings.sectionLanguage')}
                </h3>
                <div className="rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#18211B] p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#223026] text-[#8FB596]">
                      <GlobeIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[#F5F2EB]">
                        {t('settings.languageLabel')}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[#F5F2EB]/55">
                        {t('settings.languageDesc')}
                      </p>
                    </div>
                  </div>

                  <div
                    role="group"
                    aria-label={t('settings.languageLabel')}
                    className="mt-3.5 grid grid-cols-2 gap-1.5 rounded-xl bg-[#0F1511] p-1"
                  >
                    <button
                      type="button"
                      id="btn-lang-id"
                      aria-pressed={language === 'id'}
                      onClick={() => handleLanguageSwitch('id')}
                      className={`min-h-[38px] rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${
                        language === 'id'
                          ? 'bg-[#F2ECE1] text-[#0D110F]'
                          : 'text-[#F5F2EB]/65 hover:text-[#F5F2EB]'
                      }`}
                    >
                      {t('settings.langId')}
                    </button>
                    <button
                      type="button"
                      id="btn-lang-en"
                      aria-pressed={language === 'en'}
                      onClick={() => handleLanguageSwitch('en')}
                      className={`min-h-[38px] rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${
                        language === 'en'
                          ? 'bg-[#F2ECE1] text-[#0D110F]'
                          : 'text-[#F5F2EB]/65 hover:text-[#F5F2EB]'
                      }`}
                    >
                      {t('settings.langEn')}
                    </button>
                  </div>
                </div>
              </section>

              {/* B. AKUN */}
              <section aria-labelledby="settings-heading-account">
                <h3
                  id="settings-heading-account"
                  className="mb-2.5 px-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#F5F2EB]/45"
                >
                  {t('settings.sectionAccount')}
                </h3>
                <div className="divide-y divide-[#F2ECE1]/[0.06] overflow-hidden rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#18211B]">
                  <button
                    type="button"
                    id="btn-settings-edit-profile"
                    onClick={() => {
                      setNameInput(profileName || '')
                      setBioInput(profileBio || '')
                      setProfileError('')
                      setSection('edit-profile')
                    }}
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#223026] text-[#C5A868]">
                      <EditIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[#F5F2EB]">
                        {t('settings.editProfileTitle')}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-[#F5F2EB]/55">
                        {t('settings.editProfileDesc')}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#F5F2EB]/40" />
                  </button>

                  <button
                    type="button"
                    id="btn-settings-change-password"
                    onClick={() => {
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                      setPasswordError('')
                      setSection('change-password')
                    }}
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#223026] text-[#8FB596]">
                      <LockIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[#F5F2EB]">
                        {t('settings.changePasswordTitle')}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-[#F5F2EB]/55">
                        {t('settings.changePasswordDesc')}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#F5F2EB]/40" />
                  </button>
                </div>
              </section>

              {/* C. PREFERENSI NAVIGASI */}
              <section aria-labelledby="settings-heading-navigation">
                <h3
                  id="settings-heading-navigation"
                  className="mb-2.5 px-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#F5F2EB]/45"
                >
                  {t('settings.sectionNavigation')}
                </h3>
                <div className="divide-y divide-[#F2ECE1]/[0.06] overflow-hidden rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#18211B]">
                  {/* Toggle Notifikasi Rute */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#223026] text-[#C5A868]">
                        <BellIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-[#F5F2EB]">
                          {t('settings.routeNotifTitle')}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-snug text-[#F5F2EB]/55">
                          {t('settings.routeNotifDesc')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-toggle-route-notif"
                      role="switch"
                      aria-checked={routeNotifications}
                      aria-label={t('settings.routeNotifTitle')}
                      onClick={handleToggleRouteNotifications}
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                        routeNotifications ? 'bg-[#76937A]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-6 w-6 rounded-full bg-[#F5F2EB] shadow-sm transition-transform duration-200 ${
                          routeNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Pilihan Satuan Jarak (KM / Miles) */}
                  <div className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#223026] text-[#8FB596]">
                        <RouteWaypointsIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-[#F5F2EB]">
                          {t('settings.distanceUnitTitle')}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-snug text-[#F5F2EB]/55">
                          {t('settings.distanceUnitDesc')}
                        </p>
                      </div>
                    </div>

                    <div
                      role="group"
                      aria-label={t('settings.distanceUnitTitle')}
                      className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-[#0F1511] p-1"
                    >
                      <button
                        type="button"
                        id="btn-unit-km"
                        aria-pressed={distanceUnit === 'km'}
                        onClick={() => handleDistanceUnitSwitch('km')}
                        className={`min-h-[38px] rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${
                          distanceUnit === 'km'
                            ? 'bg-[#F2ECE1] text-[#0D110F]'
                            : 'text-[#F5F2EB]/65 hover:text-[#F5F2EB]'
                        }`}
                      >
                        {t('settings.unitKm')}
                      </button>
                      <button
                        type="button"
                        id="btn-unit-mi"
                        aria-pressed={distanceUnit === 'mi'}
                        onClick={() => handleDistanceUnitSwitch('mi')}
                        className={`min-h-[38px] rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${
                          distanceUnit === 'mi'
                            ? 'bg-[#F2ECE1] text-[#0D110F]'
                            : 'text-[#F5F2EB]/65 hover:text-[#F5F2EB]'
                        }`}
                      >
                        {t('settings.unitMiles')}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* D. ZONA BAHAYA: Keluar dari Akun */}
              {onRequestLogout && (
                <section aria-labelledby="settings-heading-danger">
                  <h3
                    id="settings-heading-danger"
                    className="mb-2.5 px-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-rose-300/65"
                  >
                    {t('settings.sectionDanger')}
                  </h3>
                  <button
                    type="button"
                    id="btn-settings-logout"
                    onClick={() => {
                      onClose?.()
                      onRequestLogout()
                    }}
                    className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-left transition-colors hover:border-rose-400/35 hover:bg-rose-500/15 active:scale-[0.99]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-200">
                      <LogOutIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-rose-100">
                        {t('settings.logoutTitle')}
                      </p>
                      <p className="mt-0.5 text-[12px] text-rose-200/65">
                        {t('settings.logoutDesc')}
                      </p>
                    </div>
                  </button>
                </section>
              )}
            </div>
          )}

          {/* SUB-VIEW 1: EDIT PROFIL (NAMA & BIO) */}
          {section === 'edit-profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
              {profileError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-100"
                >
                  <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  <span>{profileError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="settings-profile-name"
                  className="mb-1.5 block text-[12px] font-medium text-[#F5F2EB]/75"
                >
                  {t('settings.nameLabel')}
                </label>
                <input
                  id="settings-profile-name"
                  type="text"
                  maxLength={100}
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value)
                    if (profileError) setProfileError('')
                  }}
                  placeholder={t('settings.namePlaceholder')}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="settings-profile-bio"
                    className="text-[12px] font-medium text-[#F5F2EB]/75"
                  >
                    {t('settings.bioLabel')}
                  </label>
                  <span className="font-mono text-[11px] tabular-nums text-[#F5F2EB]/40">
                    {bioInput.length}/240
                  </span>
                </div>
                <textarea
                  id="settings-profile-bio"
                  rows={4}
                  maxLength={240}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder={t('settings.bioPlaceholder')}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSavingProfile}
                  onClick={() => (initialSection === 'menu' ? setSection('menu') : onClose?.())}
                  className="min-h-[44px] flex-1 rounded-xl border border-[#F2ECE1]/12 bg-white/[0.05] px-4 text-[13px] font-semibold text-[#F5F2EB]/85 transition-colors hover:bg-white/[0.1] disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  id="btn-save-profile-changes"
                  disabled={isSavingProfile}
                  className="apple-retro-cta min-h-[44px] flex-1 rounded-xl px-4 text-[13px] font-bold active:scale-[0.98] disabled:opacity-60"
                >
                  {isSavingProfile ? t('common.saving') : t('common.saveChanges')}
                </button>
              </div>
            </form>
          )}

          {/* SUB-VIEW 2: UBAH KATA SANDI */}
          {section === 'change-password' && (
            <form onSubmit={handleSavePassword} className="space-y-4" noValidate>
              {passwordError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-100"
                >
                  <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="settings-current-password"
                  className="mb-1.5 block text-[12px] font-medium text-[#F5F2EB]/75"
                >
                  {t('settings.currentPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="settings-current-password"
                    type={showCurrentPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value)
                      if (passwordError) setPasswordError('')
                    }}
                    placeholder={t('settings.currentPasswordPlaceholder')}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    aria-label={showCurrentPw ? t('settings.hidePasswordAria') : t('settings.showPasswordAria')}
                    className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#F5F2EB]/55 hover:text-[#F5F2EB]"
                  >
                    {showCurrentPw ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="settings-new-password"
                  className="mb-1.5 block text-[12px] font-medium text-[#F5F2EB]/75"
                >
                  {t('settings.newPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="settings-new-password"
                    type={showNewPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (passwordError) setPasswordError('')
                    }}
                    placeholder={t('settings.newPasswordPlaceholder')}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    aria-label={showNewPw ? t('settings.hidePasswordAria') : t('settings.showPasswordAria')}
                    className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#F5F2EB]/55 hover:text-[#F5F2EB]"
                  >
                    {showNewPw ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="settings-confirm-password"
                  className="mb-1.5 block text-[12px] font-medium text-[#F5F2EB]/75"
                >
                  {t('settings.confirmPasswordLabel')}
                </label>
                <input
                  id="settings-confirm-password"
                  type={showNewPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSavingPassword}
                  onClick={() => setSection('menu')}
                  className="min-h-[44px] flex-1 rounded-xl border border-[#F2ECE1]/12 bg-white/[0.05] px-4 text-[13px] font-semibold text-[#F5F2EB]/85 transition-colors hover:bg-white/[0.1] disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  id="btn-save-password-changes"
                  disabled={isSavingPassword}
                  className="apple-retro-cta min-h-[44px] flex-1 rounded-xl px-4 text-[13px] font-bold active:scale-[0.98] disabled:opacity-60"
                >
                  {isSavingPassword ? t('common.saving') : t('settings.updatePasswordBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default memo(ProfileSettingsSheet)
