'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Location } from '@/types/location'
import { MapPin, Phone, Clock, Navigation } from 'lucide-react'

// 自訂標記圖示
const createCustomIcon = (isSelected = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div class="w-10 h-10 rounded-full ${isSelected ? 'bg-green-600' : 'bg-green-500'}
          flex items-center justify-center shadow-lg border-2 border-white
          transform ${isSelected ? 'scale-125' : ''} transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2
          w-2 h-2 bg-green-600 rotate-45"></div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  })
}

// 地圖自動調整範圍元件
function MapBounds({ locations }: { locations: Location[] }) {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 0) return

    const bounds = L.latLngBounds(
      locations
        .filter((loc) => loc.coordinates?.lat && loc.coordinates?.lng)
        .map((loc) => [loc.coordinates.lat, loc.coordinates.lng] as [number, number])
    )

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [map, locations])

  return null
}

// 地圖中心控制元件
function MapCenter({
  center,
  zoom,
}: {
  center: [number, number] | null
  zoom?: number
}) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 15, { animate: true })
    }
  }, [map, center, zoom])

  return null
}

export interface LocationMapClientProps {
  locations: Location[]
  selectedLocation?: Location | null
  onLocationSelect?: (location: Location) => void
  className?: string
  showPopups?: boolean
  center?: [number, number] | null
  zoom?: number
}

export function LocationMapClient({
  locations,
  selectedLocation,
  onLocationSelect,
  className = '',
  showPopups = true,
  center,
  zoom = 13,
}: LocationMapClientProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 預設中心點（台灣中部）
  const defaultCenter: [number, number] = [23.97, 120.97]

  // 計算初始中心
  const initialCenter =
    center ||
    (locations.length > 0 && locations[0].coordinates?.lat && locations[0].coordinates?.lng
      ? [locations[0].coordinates.lat, locations[0].coordinates.lng]
      : defaultCenter) as [number, number]

  if (!isMounted) {
    return (
      <div
        className={`bg-gray-100 animate-pulse flex items-center justify-center ${className}`}
      >
        <div className="text-gray-400">載入地圖中...</div>
      </div>
    )
  }

  return (
    <MapContainer
      center={initialCenter}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {!center && <MapBounds locations={locations} />}
      {center && <MapCenter center={center} zoom={zoom} />}

      {locations.map((location) => {
        if (!location.coordinates?.lat || !location.coordinates?.lng) return null

        const isSelected = selectedLocation?.id === location.id
        const icon = createCustomIcon(isSelected)

        return (
          <Marker
            key={location.id}
            position={[location.coordinates.lat, location.coordinates.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onLocationSelect?.(location),
            }}
          >
            {showPopups && (
              <Popup className="location-popup">
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {location.name}
                  </h3>

                  {location.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{location.address}</span>
                    </div>
                  )}

                  {location.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <a
                        href={`tel:${location.phone}`}
                        className="hover:text-green-600"
                      >
                        {location.phone}
                      </a>
                    </div>
                  )}

                  {location.hours && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{location.hours}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white
                        text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      導航
                    </a>
                    {onLocationSelect && (
                      <button
                        onClick={() => onLocationSelect(location)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700
                          text-sm rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        查看詳情
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        )
      })}
    </MapContainer>
  )
}
