export function propertyResources(project, resolveUrl) {
  const value = resource => {
    if (typeof resource === 'string') return resource;
    return resource?.url || resource?.fileUrl || resource?.uri || resource?.file || resource?.link || null;
  };
  // Factsheets can be stored on the project or returned by the documents API.
  const factSheetDocuments = Array.isArray(project?.documents)
    ? project.documents.filter(document =>
      String(document?.type || '').toLowerCase().replace(/[\s_-]/g, '') === 'factsheet')
    : [];
  const factSheet = [
    project?.factSheet,
    project?.factsheet,
    project?.factSheetUrl,
    project?.factsheetUrl,
    project?.fact_sheet,
    ...factSheetDocuments,
  ].map(resource => resolveUrl(value(resource))).find(Boolean) || null;
  const latitude = project?.location?.lat ?? project?.location?.latitude;
  const longitude = project?.location?.lng ?? project?.location?.longitude;
  const directions = value(project?.directionLink) || (
    latitude != null && longitude != null && String(latitude).trim() !== "" && String(longitude).trim() !== "" && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : null
  );
  return {
    brochure: resolveUrl(value(project?.brochure || project?.brochureUrl || project?.brochurePdf)),
    factSheet,
    walkthrough: resolveUrl(value(project?.virtualWalkthroughLink)),
    directions: resolveUrl(directions),
  };
}
