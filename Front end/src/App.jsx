import { useCallback, useMemo, useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import tourists from './data/tourists.json'
import { useFilteredTourists } from './hooks/useMapControls'
import { useFavorites } from './hooks/useFavorites'
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

export default function App() {
  // 1. State aktif untuk tab navigasi (Explore, Untuk Anda, Navigasi, Tersimpan, Aktivitas)
  const [activeTab, setActiveTab] = useState('Explore')

  // HTML5 User GPS Location
  const { position: userPosition } = useUserLocation()

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

  const navigate = useNavigate()
  const match = useMatch('/place/:slug')
  const selectedSlug = match?.params.slug ?? null

  const routePlace = useMemo(
    () => (selectedSlug ? tourists.find((t) => t.slug === selectedSlug) ?? null : null),
    [selectedSlug],
  )

  // State untuk menyimpan data objek tempat wisata yang sedang dipilih untuk Detail Wisata
  const [clickedPlace, setClickedPlace] = useState(null)
  const selectedPlace = clickedPlace ?? routePlace
  const selected = selectedPlace

  const filtered = useFilteredTourists(tourists, category, query)

  const mapPlaces = useMemo(
    () => (selected && !filtered.includes(selected) ? [...filtered, selected] : filtered),
    [filtered, selected],
  )

  // Trigger klik kartu wisata di sidebar ATAU popup marker di peta
  const handleSelect = useCallback(
    (slugOrPlace) => {
      const place =
        typeof slugOrPlace === 'object' && slugOrPlace !== null
          ? slugOrPlace
          : tourists.find((t) => t.slug === slugOrPlace) ?? null

      setClickedPlace(place)
      setProfileUser(null)
      setSheetExpanded(false)
      setActiveTab('Explore')
      if (place) {
        navigate(`/place/${place.slug}`, { replace: selectedSlug !== null })
      }
    },
    [navigate, selectedSlug],
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

  // 4. FUNGSI LOGOUT GLOBAL:
  // Ubah status global isLoggedIn(false), hapus data rute custom aktif, dan tendang ke Explore
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false)
    setNavigationTarget(null)
    setProfileUser(null)
    setActiveTab('Explore')
    navigate('/')
  }, [navigate])

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true)
    setShowLoginModal(false)
  }, [])

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
      if (tabName === 'Explore' && selectedSlug) {
        navigate('/')
      }
    },
    [navigate, selectedSlug],
  )

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-forest-900">
      <h1 className="sr-only">SIG Wisata Bogor</h1>

      {/* 3. TAMPILAN HALAMAN PROFIL (Akun Sendiri vs Orang Lain) */}
      {profileUser ? (
        <ProfilePage
          user={profileUser}
          onBack={() => setProfileUser(null)}
          onLogout={handleLogout}
          onStartCustomRoute={handleStartCustomRoute}
        />
      ) : selectedPlace ? (
        /* 1 & 2. Tampilkan Detail Wisata penuh jika selectedPlace tidak null */
        <TouristDetailPage
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
            <div className="relative h-full w-full">
              <MapView
                places={mapPlaces}
                selected={selected}
                onSelect={handleSelect}
                userPosition={userPosition}
                navigationTarget={null}
                onStopNavigation={handleStopNavigation}
                isNavigationMode={false}
              />
              <SidebarContainer
                places={filtered}
                selected={selected}
                category={category}
                onCategoryChange={setCategory}
                query={query}
                onQueryChange={setQuery}
                onSelect={handleSelect}
                expanded={sheetExpanded}
                onExpandedChange={setSheetExpanded}
              />
            </div>
          )}

          {/* Menu Navigasi: CLEAN UI (Peta Rute Navigasi dengan Single Titik atau Multi-Waypoints) */}
          {activeTab === 'Navigasi' && (
            <div className="relative h-full w-full">
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
                navigationTarget={navigationTarget}
                onStopNavigation={handleStopNavigation}
                isNavigationMode={true}
              />
            </div>
          )}

          {/* Menu Untuk Anda: Halaman Rekomendasi "Untuk Kamu" */}
          {activeTab === 'Untuk Anda' && (
            <ForYouPage
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onSelectPlace={handleSelect}
            />
          )}

          {/* Menu Tersimpan: Halaman "Aktivitas Tersimpan" */}
          {(activeTab === 'Tersimpan' || activeTab === 'Aktivitas Tersimpan') && (
            <SavedActivitiesPage
              favorites={favorites}
              onSelectPlace={handleSelect}
              onStartCustomRoute={handleStartCustomRoute}
              isLoggedIn={isLoggedIn}
              onRequireLogin={() => setShowLoginModal(true)}
              onOpenProfile={setProfileUser}
            />
          )}

          {/* Menu Aktivitas: Halaman Utama Aktivitas & Komunitas */}
          {activeTab === 'Aktivitas' && (
            <ActivitiesPage
              isLoggedIn={isLoggedIn}
              onRequireLogin={() => setShowLoginModal(true)}
              onOpenProfile={setProfileUser}
            />
          )}
        </>
      )}

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
