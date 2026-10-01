export const DEV_TOOL_GROUPS = [
  {
    title: 'Astro Preview',
    tools: [
      {
        label: 'Single Type Coverage',
        path: '/single-type-coverage',
        description:
          'Available in Astro: weighted single-type coverage recommendations.',
        status: 'available'
      },
      {
        label: 'Public Tools Index',
        path: '/tools',
        description:
          'Available in Astro: the public-facing tools and calculators index.',
        status: 'available'
      }
    ]
  },
  {
    title: 'Calibration',
    tools: [
      {
        label: 'Team Coverage Scoring',
        path: '/dev/team-coverage-scoring',
        description:
          'Tune suggested teammate scoring weights for coverage, availability, trade evolution, tier, and BST value.',
        status: 'available'
      },
      {
        label: 'Single Type Coverage Scoring',
        path: '/dev/single-type-coverage-scoring',
        description:
          'Tune weighted single-type recommendations for availability, defensive coverage, and STAB coverage.',
        status: 'available'
      }
    ]
  },
  {
    title: 'Authoring',
    tools: [
      { label: 'Article Studio', path: '/dev/article-studio', sourcePath: '/article-studio', description: 'Local article authoring, preview, image picking, validation, and save flow.' },
      { label: 'Feebas Tile Editor', path: '/dev/feebas-tile-editor', description: 'Mt. Coronet Feebas fishing tile grid editor with local save and JSON import/export.' },
      { label: 'RSE Route 119 Feebas Tile Editor', path: '/dev/rse-feebas-tile-editor', description: 'Route 119 fishing spot mapping editor with 140-row grid, section validation, local save, and JSON import/export.' },
      { label: 'RSE Feebas Algorithm Validator', path: '/dev/rse-feebas-algorithm-validator', description: 'Route 119 custom Feebas value validator with RNG diagnostics, map highlights, and Muck comparison tracking.' },
      { label: 'Emerald Feebas Recovery Validator', path: '/dev/emerald-feebas-recovery-validator', description: 'Emerald Trainer ID and Dewford Trend recovery validator for candidate Feebas values.' },
      { label: 'Emerald .sav Exact Feebas Validator', path: '/dev/emerald-feebas-save-validator', description: 'Read-only local Emerald save parser that extracts the stored Feebas value and renders exact Route 119 tiles.' },
      { label: 'Ruby/Sapphire Feebas Recovery Validator', path: '/dev/rs-feebas-recovery-validator', description: 'Developer Ruby/Sapphire Feebas save extraction, dead-RTC prediction, and working-battery state search.' },
      { label: 'Feebas Map Validator', path: '/dev/feebas-map-validator', description: 'DPPt Feebas index-to-map renderer validation with group boundaries, audits, and test cases.' },
      { label: 'DPPt Feebas Calculator', path: '/dev/dppt-feebas-calculator', description: 'Local lottery-number seed recovery, Feebas index calculation, diagnostics, and external visual comparison workflow.' }
    ]
  },
  {
    title: 'Review',
    tools: [
      { label: 'SEO Review', path: '/dev/seo-review', sourcePath: '/seo-review', description: 'Local title/meta-description review utility with browser drafts and override export.' },
      { label: 'Topic Review Mode', path: '/dev/topic-review-mode', sourcePath: '/topic/forest-pokemon?review=1', description: 'Review generated Pokédex topic matches and export local curation removals.' },
      { label: 'Pokémon Size Review', path: '/dev/pokemon-size-review', sourcePath: '/pokemon/bulbasaur?size-review=1', description: 'Sprite size correction controls on a Pokémon detail page. The mode carries across Pokémon links.' }
    ]
  },
  {
    title: 'OG Previews',
    tools: [
      { label: 'OG Preview Index', path: '/dev/og-preview', sourcePath: '/og-preview', description: 'Landing view for Open Graph card previews.' },
      { label: 'OG Pokémon Preview', path: '/dev/og-pokemon-preview', sourcePath: '/og-preview/pokemon/697', description: 'Sample Pokémon Open Graph card.' },
      { label: 'OG Move Preview', path: '/dev/og-move-preview', sourcePath: '/og-preview/move/thunderbolt', description: 'Sample move Open Graph card.' },
      { label: 'OG Topic Preview', path: '/dev/og-topic-preview', sourcePath: '/og-preview/topic/forest-pokemon', description: 'Sample Pokédex topic Open Graph card.' },
      { label: 'OG Item Preview', path: '/dev/og-item-preview', sourcePath: '/og-preview/item/master-ball', description: 'Sample item Open Graph card.' }
    ]
  }
];

export const DEV_TOOL_ROUTES = DEV_TOOL_GROUPS.flatMap(group =>
  group.tools.filter(
    tool => tool.path.startsWith('/dev/') && tool.status !== 'available'
  )
);

export const DEV_TOOL_BY_SLUG = new Map(
  DEV_TOOL_ROUTES.map(tool => [tool.path.slice('/dev/'.length), tool])
);
