export type AreaShape =
  | { type: 'circle'; center: { lat: number; lng: number }; radius: number }
  | { type: 'polygon'; path: Array<{ lat: number; lng: number }> };

export function pointInShape(shape: AreaShape, lat: number, lng: number): boolean {
  const g = (window as any).google;
  if (!g || !g.maps) return false;

  const point = new g.maps.LatLng(lat, lng);

  if (shape.type === 'circle') {
    if (!g.maps.geometry || !g.maps.geometry.spherical) return false;
    const center = new g.maps.LatLng(shape.center.lat, shape.center.lng);
    const distance = g.maps.geometry.spherical.computeDistanceBetween(point, center);
    return distance <= shape.radius;
  }

  if (shape.type === 'polygon') {
    if (!g.maps.geometry || !g.maps.geometry.poly) return false;
    const polygon = new g.maps.Polygon({ paths: shape.path });
    return g.maps.geometry.poly.containsLocation(point, polygon);
  }

  return false;
}

export function shapesEqual(a: AreaShape | null, b: AreaShape | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'circle' && b.type === 'circle') {
    return (
      a.center.lat === b.center.lat &&
      a.center.lng === b.center.lng &&
      a.radius === b.radius
    );
  }
  if (a.type === 'polygon' && b.type === 'polygon') {
    if (a.path.length !== b.path.length) return false;
    return a.path.every((p, i) => p.lat === b.path[i].lat && p.lng === b.path[i].lng);
  }
  return false;
}
