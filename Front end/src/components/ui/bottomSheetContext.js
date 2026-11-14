import { createContext, useContext } from 'react'

export const BottomSheetContext = createContext(null)

export function useBottomSheet() {
  return useContext(BottomSheetContext)
}

