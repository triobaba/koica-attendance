export type CheckInLocation = {
  latitude: number | null
  longitude: number | null
  accuracyMeters: number | null
  mapsUrl: string
  locationStatus: 'ok' | 'denied' | 'timeout' | 'unavailable'
}

const emptyLocation = (locationStatus: CheckInLocation['locationStatus']): CheckInLocation => ({
  latitude: null,
  longitude: null,
  accuracyMeters: null,
  mapsUrl: '',
  locationStatus,
})

export const getCheckInLocation = (): Promise<CheckInLocation> => {
  if (!navigator.geolocation) {
    return Promise.resolve(emptyLocation('unavailable'))
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        resolve({
          latitude,
          longitude,
          accuracyMeters: position.coords.accuracy,
          mapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
          locationStatus: 'ok',
        })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve(emptyLocation('denied'))
          return
        }
        if (error.code === error.TIMEOUT) {
          resolve(emptyLocation('timeout'))
          return
        }
        resolve(emptyLocation('unavailable'))
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )
  })
}
