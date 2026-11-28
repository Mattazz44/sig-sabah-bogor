import { Navigate, Route, Routes } from 'react-router-dom'
import TouristList from './TouristList'
import TouristDetail from './TouristDetail'
import ResponsiveSidebar from './ResponsiveSidebar'
import { usePreferences } from '../../utils/preferences'

export default function SidebarContainer({
  places,
  selected,
  hoveredPlaceId = null,
  category,
  onCategoryChange,
  query,
  onQueryChange,
  radiusKm = 0,
  onRadiusChange,
  hasUserLocation = false,
  onRequestLocation,
  onSelect,
  onHoverPlace,
  expanded,
  onExpandedChange,
  isLoading = false,
  isBackendError = false,
  isRetryingBackend = false,
  onRetryBackend,
  isFavorite,
  toggleFavorite,
}) {
  const { t } = usePreferences()
  const selectedId = selected && !Array.isArray(selected) ? selected.id : null
  const selectedStamp = selected && !Array.isArray(selected) ? (selected._selectedAt ?? selected.id ?? 0) : 0

  return (
    <ResponsiveSidebar
      id="sidebar"
      label={t('explore.sidebarLabel')}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
      <Routes>
        <Route
          path="/"
          element={
            <TouristList
              places={places}
              selectedId={selectedId}
              selectedStamp={selectedStamp}
              hoveredPlaceId={hoveredPlaceId}
              category={category}
              onCategoryChange={onCategoryChange}
              query={query}
              onQueryChange={onQueryChange}
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              hasUserLocation={hasUserLocation}
              onRequestLocation={onRequestLocation}
              onSelect={onSelect}
              onHoverPlace={onHoverPlace}
              isLoading={isLoading}
              isBackendError={isBackendError}
              isRetryingBackend={isRetryingBackend}
              onRetryBackend={onRetryBackend}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
            />
          }
        />
        <Route path="/place/:slug" element={<TouristDetail place={selected} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ResponsiveSidebar>
  )
}
