const FEEBAS_ULTIMATE_GUIDE = {
  label: "Catching Feebas: The Ultimate Guide",
  to: "/topic/catching-feebas-every-generation"
};

const FEEBAS_GUIDE_BREADCRUMBS = {
  "catching-feebas-every-generation": [
    {
      label: "Topics",
      to: "/topics"
    },
    {
      label: FEEBAS_ULTIMATE_GUIDE.label
    }
  ],
  "catching-feebas-in-pokemon-emerald": [
    FEEBAS_ULTIMATE_GUIDE,
    {
      label: "Catching Feebas in Pokemon Emerald"
    }
  ],
  "catching-feebas-in-pokemon-diamond-pearl-and-platinum": [
    FEEBAS_ULTIMATE_GUIDE,
    {
      label: "Catching Feebas in Pokemon Diamond/Pearl/Platinum"
    }
  ],
  "catching-feebas-in-pokemon-omega-ruby-and-alpha-sapphire": [
    FEEBAS_ULTIMATE_GUIDE,
    {
      label: "Catching Feebas in Omega Ruby and Alpha Sapphire"
    }
  ],
  "catching-feebas-in-brilliant-diamond-and-shining-pearl": [
    FEEBAS_ULTIMATE_GUIDE,
    {
      label: "Catching Feebas in Pokemon Brilliant Diamond and Shining Pearl"
    }
  ],
  "evolving-feebas-into-milotic-via-beauty": [
    FEEBAS_ULTIMATE_GUIDE,
    {
      label: "Evolving Feebas Via Beauty"
    }
  ],
  "dppt-feebas-calculator": [
    FEEBAS_ULTIMATE_GUIDE,
    {
      label: "Catching Feebas in Pokemon Diamond/Pearl/Platinum",
      to: "/topic/catching-feebas-in-pokemon-diamond-pearl-and-platinum"
    },
    {
      label: "Feebas Tile Calculator for Diamond/Pearl/Platinum"
    }
  ]
};

export function getFeebasGuideBreadcrumbs(pageId) {
  return FEEBAS_GUIDE_BREADCRUMBS[pageId] ?? null;
}
