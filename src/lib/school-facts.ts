/**
 * Official identifiers and figures that have no field in School details.
 *
 * Source: the school profile and the admissions brochure, supplied by the school 2026-10-22.
 * They change rarely, so they live here rather than in the CMS (no migration needed). Edit
 * this file if the school reports a change.
 */

export const schoolFacts = {
  /** Ministry of Education and Sports registration and classification number. */
  registrationNumber: 'PSS/A/25',
  /** UNEB examinations centre number, for both O and A level. */
  unebCentre: 'U0839',
  /** Ministry of Education and Sports selection code, used when choosing schools after PLE and UCE. */
  selectionCode: '2627',
  selectionClasses: 'Senior One and Senior Five',
  campusAcres: 6,
  ageRange: '12 to 18',
  /** Streams per class, Senior One to Senior Four. */
  oLevelStreams: 2,
  staff: { resident: 44, visiting: 25, support: 20 },
  directions:
    'About 700 metres off Yesu Amala trading centre in Nansana, roughly 7.5 miles (12 km) from Kampala city centre along the Kampala–Hoima highway.',
} as const
