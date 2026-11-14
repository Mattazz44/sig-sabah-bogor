import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { useFilteredTourists } from './hooks/useMapControls'
import { useFavorites } from './hooks/useFavorites'
import { useRecentlyViewed } from './hooks/useRecentlyViewed'
import { useUserLocation } from './hooks/useUserLocation'
import { ALL_CATEGORY } from './components/ui/categories'
import SidebarContainer from './components/sidebar/SidebarContainer'
import MapView from './components/map/MapContainer'
import BottomNav from './components/ui/BottomNav'
import ForYouPage from './components/pages/ForYouPage'
import SavedActivitiesPage from './components/pages/SavedActivitiesPage'
import ActivitiesPage from './components/pages/ActivitiesPage'
import TouristDetailPage from './components/pages/TouristDetailPage'
import ProfilePage from './components/pages/ProfilePage'
import LoginModal from './components/ui/LoginModal'
import { enrichTouristWithUserLocation } from './utils/distance'
import { apiFetch } from './utils/api'
import { getImageUrl } from './utils/imageHelper'
import { AlertTriangleIcon, RefreshIcon, XIcon } from './components/ui/VectorIcons'

export default function App() {
  // Data destinasi wisata: murni di-fetch dari API backend Laravel (PostgreSQL / PostGIS)
  const [tourists, setTourists] = useState([])
  const [isLoadingTourists, setIsLoadingTourists] = useState(true)
  const [isBackendError, setIsBackendError] = useState(false)
  const [isErrorBannerDismissed, setIsErrorBannerDismissed] = useState(false)
  const [isRetryingBackend, setIsRetryingBackend] = useState(false)
  const isMountedRef = useRef(true)
  const mapHoverHandlerRef = useRef(null)

  const handleRegisterMapHover = useCallback((fn) => {
    mapHoverHandlerRef.current = fn
  }, [])

  const handleHoverPlace = useCallback((placeId) => {
    mapHoverHandlerRef.current?.(placeId)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchTouristsData = useCallback(async () => {
    const res = await apiFetch('/api/tourists')
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const json = await res.json()

    if (json?.data && Array.isArray(json.data)) {
      // Normalisasi path image & gallery agar menggunakan helper getImageUrl
      return json.data.map((item) => ({
        ...item,
        image: getImageUrl(item.image),
        gallery: Array.isArray(item.gallery) ? item.gallery.map(getImageUrl) : [],
      }))
    }
    return null
  }, [])

  useEffect(() => {
    let isMounted = true

    fetchTouristsData()
      .then((normalized) => {
        if (isMounted && normalized) {
          setTourists(normalized)
          setIsBackendError(false)
          setIsErrorBannerDismissed(false)
        }
      })
      .catch((err) => {
        console.error('Gagal memuat data objek wisata dari backend Laravel:', err)
        if (isMounted) {
          setTourists([])
          setIsBackendError(true)
          setIsErrorBannerDismissed(false)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTourists(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [fetchTouristsData])

  const handleRetryBackend = useCallback(() => {
    setIsRetryingBackend(true)
    fetchTouristsData()
      .then((normalized) => {
        if (isMountedRef.current && normalized) {
          setTourists(normalized)
          setIsBackendError(false)
          setIsErrorBannerDismissed(false)
        }
      })
      .catch((err) => {
        console.error('Gagal memuat data objek wisata dari backend Laravel:', err)
        if (isMountedRef.current) {
          setTourists([])
          setIsBackendError(true)
          setIsErrorBannerDismissed(false)
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsRetryingBackend(false)
          setIsLoadingTourists(false)
        }
      })
  }, [fetchTouristsData])

  // 1. State aktif untuk tab navigasi (Explore, Untuk Anda, Navigasi, Tersimpan, Aktivitas)
  const [activeTab, setActiveTab] = useState('Explore')

  // HTML5 User GPS Location
  const {
    position: userPosition,
    status: locationStatus,
    requestLocation: handleRequestLocation,
  } = useUserLocation()

  // Perkaya data tempat wisata dengan jarak dan waktu tempuh dinamis dari lokasi user
  const enrichedTourists = useMemo(
    () => tourists.map((place) => enrichTouristWithUserLocation(place, userPosition)),
    [tourists, userPosition],
  )

  // State mode navigasi internal peta (destination object atau array rute custom)
  const [navigationTarget, setNavigationTarget] = useState(null)

  // 1 & 4. GLOBAL AUTH & PROFILE STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [profileUser, setProfileUser] = useState(null) // null | 'self' | { isSelf: false, name: 'Kirk hasibuan', ... }

  const [category, setCategory] = useState(ALL_CATEGORY)
  const [query, setQuery] = useState('')
  const [sheetExpanded, setSheetExpanded] = useState(false)

  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const { recentSlugs, addRecentlyViewed } = useRecentlyViewed()

  const location = useLocation()
  const navigate = useNavigate()
  const isAdminRoute = Boolean(useMatch('/admin'))
  const match = useMatch('/place/:slug')
  const selectedSlug = match?.params.slug ?? null

  const routePlace = useMemo(
    () => (selectedSlug ? enrichedTourists.find((t) => t.slug === selectedSlug) ?? null : null),
    [selectedSlug, enrichedTourists],
  )

  // State untuk menyimpan objek tempat wisata terpilih sekaligus selalu tersinkron ke URL slug
  const [clickedPlace, setClickedPlace] = useState(null)
  const selectedPlace = useMemo(() => {
    if (!selectedSlug) return null
    const matchedClicked =
      clickedPlace && clickedPlace.slug === selectedSlug ? clickedPlace : null
    const targetPlace = routePlace ?? matchedClicked
    return targetPlace ? enrichTouristWithUserLocation(targetPlace, userPosition) : null
  }, [selectedSlug, routePlace, clickedPlace, userPosition])
  const selected = selectedPlace

  const filtered = useFilteredTourists(enrichedTourists, category, query)

  const mapPlaces = useMemo(
    () => (selected && !filtered.includes(selected) ? [...filtered, selected] : filtered),
    [filtered, selected],
  )

  // Trigger klik kartu wisata di sidebar ATAU popup marker di peta
  const handleSelect = useCallback(
    (slugOrPlace) => {
      const incomingSlug =
        typeof slugOrPlace === 'object' && slugOrPlace !== null
          ? slugOrPlace.slug
          : slugOrPlace
      const canonicalPlace = incomingSlug
        ? enrichedTourists.find((t) => t.slug === incomingSlug) ?? null
        : null
      const place =
        canonicalPlace ??
        (typeof slugOrPlace === 'object' && slugOrPlace !== null ? slugOrPlace : null)

      setClickedPlace(place)
      setProfileUser(null)
      setSheetExpanded(false)
      setActiveTab('Explore')
      const targetSlug = place?.slug ?? incomingSlug
      if (targetSlug) {
        addRecentlyViewed(targetSlug)
        navigate(`/place/${targetSlug}`, { replace: selectedSlug !== null })
      }
    },
    [navigate, selectedSlug, enrichedTourists, addRecentlyViewed],
  )

  // Tombol kembali (<-) mengosongkan state selectedPlace dan kembali ke peta utama
  const handleBackToExplore = useCallback(() => {
    setClickedPlace(null)
    setProfileUser(null)
    navigate('/')
  }, [navigate])

  // 1. WORKFLOW INTERAKSI NAVIGASI INTERNAL:
  const handleStartNavigation = useCallback(
    (place) => {
      setClickedPlace(null)
      setProfileUser(null)
      navigate('/')
      setActiveTab('Navigasi') // AUTO SWITCH TO NAVIGASI TAB
      setNavigationTarget(place)
      setSheetExpanded(false)
    },
    [navigate],
  )

  // 5. WORKFLOW RUTE CUSTOM MULTI-TITIK:
  // Mulai navigasi langsung dengan array titik rute custom (Museum of Zoology -> Museum PETA)
  const handleStartCustomRoute = useCallback(
    (places) => {
      setClickedPlace(null)
      setProfileUser(null)
      navigate('/')
      setActiveTab('Navigasi') // AUTO SWITCH TO NAVIGASI TAB
      setNavigationTarget(places) // Array [museumZoologi, museumPeta]
      setSheetExpanded(false)
    },
    [navigate],
  )

  const [currentUser, setCurrentUser] = useState(null)

  const handleLoginSuccess = useCallback((userData) => {
    if (userData) {
      setCurrentUser(userData)
      setIsLoggedIn(true)
      setShowLoginModal(false)
      return
    }

    // Fallback jika dipanggil tanpa payload userData
    apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: 'ambalingham@gmail.com' }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) {
          setCurrentUser(json.data)
        }
      })
      .catch((err) => {
        console.warn('Gagal login via API, fallback ke state lokal:', err)
      })
      .finally(() => {
        setIsLoggedIn(true)
        setShowLoginModal(false)
      })
  }, [])

  // 4. FUNGSI LOGOUT GLOBAL:
  // Ubah status global isLoggedIn(false), hapus data rute custom aktif, dan tendang ke Explore
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setNavigationTarget(null)
    setProfileUser(null)
    setActiveTab('Explore')
    navigate('/')
  }, [navigate])

  // Akhiri Perjalanan: hapus garis rute dari peta dan kembalikan activeTab ke 'Explore'
  const handleStopNavigation = useCallback(() => {
    setNavigationTarget(null)
    setActiveTab('Explore')
  }, [])

  const handleTabChange = useCallback(
    (tabName) => {
      setClickedPlace(null)
      setProfileUser(null)
      setActiveTab(tabName)
      if (location.pathname !== '/') {
        navigate('/')
      }
    },
    [location.pathname, navigate],
  )

  useEffect(() => {
    if (isAdminRoute) {
      window.location.replace('http://localhost:8000/admin')
    }
  }, [isAdminRoute])

  if (isAdminRoute) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center bg-forest-900 px-6 text-center text-[#EBF0EB]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-[#141C14]/70 text-[#E2D7B5] shadow-lg backdrop-blur-xl">
          <RefreshIcon className="h-6 w-6 animate-spin" />
        </div>
        <h1 className="mt-4 text-[18px] font-bold tracking-tight text-[#EBF0EB]">
          Mengarahkan ke Panel Admin...
        </h1>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[#C8D3C8]">
          Anda sedang dialihkan ke sistem manajemen destinasi backend di{' '}
          <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[12px] text-[#E2D7B5]">
            localhost:8000/admin
          </code>
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="http://localhost:8000/admin"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#EBF0EB] px-6 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors hover:bg-[#DCE4DC] active:scale-[0.98]"
          >
            Buka Panel Admin (Port 8000)
          </a>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 bg-[#141C14]/60 px-5 text-[13px] font-medium text-[#C8D3C8] transition-colors hover:bg-white/10 hover:text-[#EBF0EB]"
          >
            Kembali ke Peta
          </button>
        </div>
      </div>
    )
  }

  const showBackendBanner = isBackendError && !isErrorBannerDismissed

  return (
    <main className="relative inset-x-0 left-0 right-0 mx-0 flex flex-col h-dvh w-full overflow-hidden bg-forest-900">
      <h1 className="sr-only">SIG Wisata Bogor</h1>

      {/* Banner Peringatan Inline jika Backend Laravel Belum Dijalankan (mendorong konten secara natural tanpa overlap) */}
      <div
        className={`relative z-30 shrink-0 grid transition-all duration-300 ease-out ${
          showBackendBanner
            ? 'grid-rows-[1fr] opacity-100 translate-y-0'
            : 'grid-rows-[0fr] opacity-0 -translate-y-2 pointer-events-none'
        }`}
        aria-hidden={!showBackendBanner}
      >
        <div className="overflow-hidden">
          <aside
            role="alert"
            aria-live="polite"
            className="w-full border-b border-rose-400/35 bg-[#2a1216] px-4 py-2.5 text-rose-100 shadow-sm"
          >
            <div className="mx-auto flex max-w-md items-center justify-between gap-2.5">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-500/20 text-rose-200">
                  <AlertTriangleIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 text-left text-[12px] leading-snug">
                  <p className="font-semibold text-[#EBF0EB]">Koneksi ke server terputus</p>
                  <p className="mt-0.5 text-rose-100/85">
                    Jalankan server Laravel (<code className="rounded bg-black/35 px-1 font-mono text-[11px]">php artisan serve</code>) untuk memuat destinasi.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRetryBackend}
                  disabled={isRetryingBackend}
                  aria-label="Coba hubungkan ulang ke backend"
                  className="relative inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/10 px-3 text-[12px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-[#EBF0EB]/18 active:scale-[0.97] disabled:opacity-50 before:absolute before:-inset-1"
                >
                  <RefreshIcon className={`h-3.5 w-3.5 ${isRetryingBackend ? 'animate-spin' : ''}`} />
                  <span>{isRetryingBackend ? 'Memuat...' : 'Coba lagi'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsErrorBannerDismissed(true)}
                  aria-label="Tutup peringatan backend"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/10 text-[#EBF0EB] transition-colors duration-150 hover:bg-[#EBF0EB]/18 active:scale-[0.97] before:absolute before:-inset-1"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Kontainer Utama Fleksibel: menjaga seluruh halaman & peta tetap proporsional di bawah banner */}
      <div className="relative inset-x-0 left-0 right-0 mx-0 flex-1 min-h-0 w-full overflow-hidden">
        {/* 3. TAMPILAN HALAMAN PROFIL (Akun Sendiri vs Orang Lain) */}
        {profileUser ? (
          <ProfilePage
            user={profileUser === 'self' && currentUser ? { isSelf: true, ...currentUser } : profileUser}
            tourists={enrichedTourists}
            favorites={favorites}
            recentSlugs={recentSlugs}
            onSelectPlace={handleSelect}
            onBack={() => setProfileUser(null)}
            onLogout={handleLogout}
            onStartCustomRoute={handleStartCustomRoute}
            onUpdateUser={(updatedUser) => {
              setCurrentUser(updatedUser)
            }}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => setShowLoginModal(true)}
          />
        ) : selectedPlace ? (
          /* 1 & 2. Tampilkan Detail Wisata penuh jika selectedPlace tidak null */
          <TouristDetailPage
            key={selectedPlace.slug}
            place={selectedPlace}
            onBack={handleBackToExplore}
            onStartNavigation={handleStartNavigation}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
          />
        ) : (
          <>
            {/* Menu Explore: Tampilkan Peta Leaflet + Sidebar wisata */}
            {activeTab === 'Explore' && (
              <div className="relative inset-x-0 left-0 right-0 mx-0 h-full w-full overflow-hidden animate-fade-enter">
              <MapView
                places={mapPlaces}
                selected={selected}
                onSelect={handleSelect}
                userPosition={userPosition}
                locationStatus={locationStatus}
                onRequestLocation={handleRequestLocation}
                navigationTarget={null}
                onStopNavigation={handleStopNavigation}
                isNavigationMode={false}
                onRegisterHoverHandler={handleRegisterMapHover}
              />
              <SidebarContainer
                places={filtered}
                selected={selected}
                category={category}
                onCategoryChange={setCategory}
                query={query}
                onQueryChange={setQuery}
                onSelect={handleSelect}
                onHoverPlace={handleHoverPlace}
                expanded={sheetExpanded}
                onExpandedChange={setSheetExpanded}
                isLoading={isLoadingTourists}
                isBackendError={isBackendError}
                isRetryingBackend={isRetryingBackend}
                onRetryBackend={handleRetryBackend}
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
              />
            </div>
          )}

          {/* Menu Navigasi: CLEAN UI (Peta Rute Navigasi dengan Single Titik atau Multi-Waypoints) */}
          {activeTab === 'Navigasi' && (
            <div className="relative h-full w-full animate-fade-enter">
              <MapView
                places={
                  navigationTarget
                    ? Array.isArray(navigationTarget)
                      ? navigationTarget
                      : [navigationTarget]
                    : mapPlaces
                }
                selected={Array.isArray(navigationTarget) ? null : navigationTarget}
                onSelect={handleSelect}
                userPosition={userPosition}
                locationStatus={locationStatus}
                onRequestLocation={handleRequestLocation}
                navigationTarget={navigationTarget}
                onStopNavigation={handleStopNavigation}
                isNavigationMode={true}
              />
            </div>
          )}

          {/* Menu Untuk Anda: Halaman Rekomendasi "Untuk Anda" */}
          {activeTab === 'Untuk Anda' && (
            <ForYouPage
              tourists={enrichedTourists}
              isLoading={isLoadingTourists}
              isBackendError={isBackendError}
              onRetryBackend={handleRetryBackend}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              recentSlugs={recentSlugs}
              onSelectPlace={handleSelect}
              onStartNavigation={handleStartNavigation}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onRequireLogin={() => setShowLoginModal(true)}
              onOpenProfile={setProfileUser}
            />
          )}

          {/* Menu Tersimpan: Halaman "Aktivitas Tersimpan" */}
          {(activeTab === 'Tersimpan' || activeTab === 'Aktivitas Tersimpan') && (
            <SavedActivitiesPage
              tourists={enrichedTourists}
              isLoadingTourists={isLoadingTourists}
              favorites={favorites}
              recentSlugs={recentSlugs}
              onSelectPlace={handleSelect}
              onStartCustomRoute={handleStartCustomRoute}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onRequireLogin={() => setShowLoginModal(true)}
              onOpenProfile={setProfileUser}
            />
          )}

            {/* Menu Aktivitas: Halaman Utama Aktivitas & Komunitas */}
            {activeTab === 'Aktivitas' && (
              <ActivitiesPage
                tourists={enrichedTourists}
                favorites={favorites}
                recentSlugs={recentSlugs}
                onSelectPlace={handleSelect}
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onRequireLogin={() => setShowLoginModal(true)}
                onOpenProfile={setProfileUser}
              />
            )}
          </>
        )}
      </div>

      {/* 4. Fixed Bottom Navigation Bar tetap kokoh di paling bawah */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onTabChange={handleTabChange}
      />

      {/* MODAL GLOBAL LOG IN PAGE OVERLAY */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </main>
  )
}
