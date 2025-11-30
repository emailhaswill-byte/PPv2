import { RockAnalysis } from './types.ts';

export const TIPS_OF_THE_DAY = [
  "Gold is often found in quartz veins. Look for white quartz rocks with rusty streaks.",
  "Pyrite (Fool's Gold) forms cubic crystals, whereas real gold is shaped like nuggets or flakes.",
  "Garnets are often found near gold deposits in stream beds as they are both heavy minerals.",
  "Serpentine rock often indicates the presence of nickel, chromium, and platinum group elements.",
  "River bends and the inside of curves are the best places to pan for gold placer deposits.",
  "Black sands (magnetite and hematite) are heavy and often settle in the same places as gold.",
  "Copper ore often stains nearby rocks green (malachite) or blue (azurite).",
  "Silver ore can look like dull, gray tarnished metal and is often heavy for its size.",
];

export const MOCK_ANALYSIS: RockAnalysis = {
  name: "Pyrite",
  scientificName: "Iron Disulfide",
  description: "Often called 'Fool's Gold', Pyrite is a brass-yellow mineral with a bright metallic luster. It has a chemical composition of iron sulfide (FeS2) and is the most common sulfide mineral.",
  economicValue: "Low",
  economicDetails: "While not valuable for gold content directly, it is used in the production of sulfur dioxide and sulfuric acid. Historically used in firearms.",
  containsPreciousMetals: false,
  associatedMetals: ["Iron", "Sulfur", "Trace Gold (rarely)"],
  confidence: 92,
  alternatives: [
    {
      name: "Gold",
      description: "A soft, yellow, corrosion-resistant element. Unlike pyrite, gold is malleable and does not break into cubic shards.",
      wikiUrl: "https://en.wikipedia.org/wiki/Gold"
    },
    {
      name: "Chalcopyrite",
      description: "Similar in color to pyrite but softer and often has a greenish tinge. It is a major source of copper.",
      wikiUrl: "https://en.wikipedia.org/wiki/Chalcopyrite"
    }
  ]
};