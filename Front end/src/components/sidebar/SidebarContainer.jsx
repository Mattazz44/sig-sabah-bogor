import { Navigate, Route, Routes } from 'react-router-dom'
import TouristList from './TouristList'
import TouristDetail from './TouristDetail'
import BottomSheet from '../ui/BottomSheet'

export default function SidebarContainer({
  places,
  selected,
  category,
  onCategoryChange,
  query,
  onQueryChange,
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
  return (
    <BottomSheet
      id="sidebar"
      label="Daftar tempat wisata"
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
      <Routes>
        <Route
          path="/"
          element={
            <TouristList
              places={places}
              category={category}
              onCategoryChange={onCategoryChange}
              query={query}
              onQueryChange={onQueryChange}
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
    </BottomSheet>
  )
}
