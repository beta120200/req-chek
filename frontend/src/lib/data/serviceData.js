// ============================================================
// ReqCheck — mock data for the "Voter's ID" service template
//
// This is the single service template used by this prototype.
// The requirement below is a "one_of" group: the applicant only
// needs ONE of the three accepted IDs. Two of those IDs have
// their own prerequisite document, which is what the dependency
// map / preparation route views walk the user through.
// ============================================================

/** @typedef {{ id: string, name: string, source: string, expirable: boolean, lastVerified: string }} DocType */

/** Library of every document referenced by the Voter's ID service. */
export const DOCUMENT_LIBRARY = {
  psa: {
    id: 'psa',
    name: 'PSA Birth Certificate',
    source: 'Philippine Statistics Authority (PSA)',
    expirable: false,
    lastVerified: 'September 2, 2026',
  },
  'national-id': {
    id: 'national-id',
    name: 'National ID (PhilSys)',
    source: 'Philippine Statistics Authority (PSA)',
    expirable: true,
    lastVerified: 'September 6, 2026',
  },
  'cert-disability': {
    id: 'cert-disability',
    name: 'Certificate of Disability',
    source: 'City / Municipal Health Office',
    expirable: false,
    lastVerified: 'August 29, 2026',
  },
  'pwd-id': {
    id: 'pwd-id',
    name: 'PWD ID',
    source: 'City / Municipal Social Welfare & Development Office',
    expirable: true,
    lastVerified: 'August 29, 2026',
  },
  'student-id': {
    id: 'student-id',
    name: "Student's ID",
    source: 'School Registrar',
    expirable: true,
    lastVerified: 'September 10, 2026',
  },
  passport: {
    id: 'passport',
    name: 'Passport',
    source: 'Department of Foreign Affairs (DFA)',
    expirable: true,
    lastVerified: 'September 5, 2026',
  },
  'drivers-license': {
    id: 'drivers-license',
    name: 'Driver\'s License',
    source: 'Land Transportation Office (LTO)',
    expirable: true,
    lastVerified: 'September 1, 2026',
  },
  'barangay-id': {
    id: 'barangay-id',
    name: 'Barangay ID/Certificate',
    source: 'Barangay Hall',
    expirable: true,
    lastVerified: 'September 3, 2026',
  },
  'voters-id': {
    id: 'voters-id',
    name: "Voter's ID",
    source: 'Commission on Elections (COMELEC)',
    expirable: false,
    lastVerified: 'September 22, 2026',
  },
};

/** All available services in the application. */
export const service = [
  {
    id: 'voters-id',
    name: "Voter's ID",
    tagline: 'Register or apply for a Voter’s ID with COMELEC.',
    description:
      "Before COMELEC will process a Voter's ID application, you need one accepted proof of identity on hand. ReqCheck checks which of the accepted IDs you already qualify for, and what to obtain next if you don't.",
    office: 'Local COMELEC Office',
    requirement: {
      id: 'primary-id',
      name: 'Primary Identification',
      source: 'COMELEC',
      lastVerified: 'September 6, 2026',
      why: "COMELEC requires one valid, accepted ID to confirm your identity before registering you as a voter. Any ONE of the options below satisfies this requirement — you don't need all three.",
      type: 'one_of',
      minCount: 1,
      options: [
        {
          id: 'national-id',
          docId: 'national-id',
          name: 'National ID (PhilSys)',
          dependsOn: 'psa',
          note: 'Apply at a PhilSys registration center once you have a PSA birth certificate.',
        },
        {
          id: 'pwd-id',
          docId: 'pwd-id',
          name: 'PWD ID',
          dependsOn: 'cert-disability',
          note: 'Apply at your city/municipal social welfare office once you have a Certificate of Disability.',
        },
        {
          id: 'student-id',
          docId: 'student-id',
          name: "Student's ID",
          dependsOn: null,
          note: 'Issued directly by your school registrar — no prerequisite document needed.',
        },
      ],
    },
  },
  {
    id: 'national-id-application',
    name: 'National ID (PhilSys) Application',
    tagline: 'Apply for a National ID through PhilSys.',
    description:
      "To apply for a Philippine National ID (PhilSys), you need to present one of the accepted supporting documents. ReqCheck checks which of the accepted documents you already have, and what to obtain next if you're missing them.",
    office: 'PhilSys Registration Center',
    requirement: {
      id: 'supporting-doc',
      name: 'Supporting Document',
      source: 'Philippine Statistics Authority (PSA)',
      lastVerified: 'September 6, 2026',
      why: "PhilSys requires one valid supporting document to confirm your identity and apply for a National ID. Any ONE of the options below satisfies this requirement — you don't need all of them.",
      type: 'one_of',
      minCount: 1,
      options: [
        {
          id: 'psa-option',
          docId: 'psa',
          name: 'PSA Birth Certificate',
          dependsOn: null,
          note: 'Your PSA birth certificate is sufficient on its own for PhilSys registration.',
        },
        {
          id: 'passport-option',
          docId: 'passport',
          name: 'Passport',
          dependsOn: null,
          note: 'A valid Philippine passport is accepted as a supporting document for PhilSys registration.',
        },
        {
          id: 'drivers-license-option',
          docId: 'drivers-license',
          name: 'Driver\'s License',
          dependsOn: null,
          note: 'A valid Driver\'s License is accepted as a supporting document for PhilSys registration.',
        },
        {
          id: 'school-id-option',
          docId: 'student-id',
          name: "Student's ID",
          dependsOn: null,
          note: "Your current School ID is accepted as a supporting document for PhilSys registration.",
        },
        {
          id: 'barangay-option',
          docId: 'barangay-id',
          name: 'Barangay ID/Certificate',
          dependsOn: null,
          note: 'A Barangay ID or Certificate of Residency is accepted as a supporting document for PhilSys registration.',
        },
      ],
    },
  },
  {
    id: 'nbi-clearance',
    name: 'NBI Clearance',
    tagline: 'Apply for an NBI Clearance with the National Bureau of Investigation.',
    description: "Before the NBI can process your clearance application, you need at least two valid identification documents from its accepted list. ReqCheck checks which IDs you already have and identifies what you can obtain next if you don't have enough.",
    office: 'National Bureau of Investigation (NBI)',
    requirement: {
      id: 'nbi-valid-ids',
      name: 'Valid Identification Documents',
      source: 'NBI',
      lastVerified: 'September 22, 2026',
      why: "The NBI requires at least two valid identification documents for an NBI Clearance application. You can satisfy this requirement with any TWO or more of the accepted documents below.",
      type: 'min_count',
      minCount: 2,
      options: [
        {
          id: 'passport',
          docId: 'passport',
          name: 'Passport',
          dependsOn: null,
          note: 'A valid Philippine passport can be used as one of your identification documents.',
        },

        {
          id: 'national-id',
          docId: 'national-id',
          name: 'National ID (PhilSys)',
          dependsOn: 'psa',
          note: 'Apply for a National ID through PhilSys. A PSA birth certificate may be used as supporting documentation during registration.',
        },

        {
          id: 'drivers-license',
          docId: 'drivers-license',
          name: "Driver's License",
          dependsOn: null,
          note: "A valid driver's license can be used as one of your identification documents.",
        },

        {
          id: 'umid',
          docId: 'umid',
          name: 'UMID',
          dependsOn: null,
          note: 'A valid UMID can be used as one of your identification documents.',
        },

        {
          id: 'postal-id',
          docId: 'postal-id',
          name: 'Postal ID',
          dependsOn: null,
          note: 'A valid Postal ID can be used as one of your identification documents.',
        },

        {
          id: 'voters-id',
          docId: 'voters-id',
          name: "Voter's ID",
          dependsOn: null,
          note: "A valid Voter's ID can be used as one of your identification documents.",
        },

        {
          id: 'philhealth-id',
          docId: 'philhealth-id',
          name: 'PhilHealth ID',
          dependsOn: null,
          note: 'A valid PhilHealth ID can be used as one of your identification documents.',
        },

        {
          id: 'tin-id',
          docId: 'tin-id',
          name: 'TIN ID',
          dependsOn: null,
          note: 'A valid TIN ID can be used as one of your identification documents.',
        },

        {
          id: 'psa',
          docId: 'psa',
          name: 'PSA Birth Certificate',
          dependsOn: null,
          note: 'A PSA birth certificate is included in the accepted document list.',
        },
      ],
    },
  },
];

/** All available services in the application (alias for service). */
export const SERVICES = service;

/** Placeholder service templates shown in the "Add a Service" modal. */
export const UPCOMING_SERVICES = [
  { id: 'clearance-app', name: 'Barangay Clearance', description: 'Apply for a barangay or police clearance.' },
  { id: 'passport', name: 'Passport', description: 'Apply for a new or renewed passport.' },
  { id: 'permit', name: 'Business Permit', description: 'Apply for a business or building permit.' },
];