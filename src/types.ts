export interface CatBreed {
  id: string
  name: string
  origin?: string
  temperament?: string
  description?: string
  wikipedia_url?: string
  life_span?: string
  alt_names?: string
  weight?: {
    imperial?: string
    metric?: string
  }
}

export interface CatCategory {
  id: number
  name: string
}

export interface CatImage {
  id: string
  url: string
  width: number
  height: number
  breeds?: CatBreed[]
  categories?: CatCategory[]
}

export type TabId = 'all' | 'favourites'
