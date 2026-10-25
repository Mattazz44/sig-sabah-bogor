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
  expanded,
  onExpandedChange,
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
            />
          }
        />
        <Route path="/place/:slug" element={<TouristDetail place={selected} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BottomSheet>
  )
}
