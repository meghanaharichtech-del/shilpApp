export function propertyResources(project, resolveUrl) {
  const value = resource => {
    if (typeof resource === 'string') return resource;
    return resource?.url || resource?.fileUrl || resource?.uri || null;
  };
  const latitude = project?.location?.lat ?? project?.location?.latitude;
  const longitude = project?.location?.lng ?? project?.location?.longitude;
  const directions = value(project?.directionLink) || (
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : null
  );
  return {
    brochure: resolveUrl(value(project?.brochure || project?.brochureUrl || project?.brochurePdf)),
    walkthrough: resolveUrl(value(project?.virtualTourUrl || project?.virtualTour || project?.virtualWalkthrough || project?.walkthroughUrl || project?.walkthrough)),
    directions: resolveUrl(directions),
  };
}
