import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { POKEMON_SLUG_SET, pokemonPath, repositoryRoot } from './routes.js';

const source = JSON.parse(readFileSync(join(repositoryRoot, 'public/data/condensedEntries.json'), 'utf8'));
const raw = JSON.parse(readFileSync(join(repositoryRoot, 'public/data/dexEntries.json'), 'utf8'));

// Species labels in the historical catalog that are represented by a default form route.
export const LEGACY_SPECIES_ROUTES = Object.freeze({
  deoxys:'deoxys-normal',wormadam:'wormadam-plant',giratina:'giratina-altered',shaymin:'shaymin-land',basculin:'basculin-red-striped',darmanitan:'darmanitan-standard',frillish:'frillish-male',jellicent:'jellicent-male',tornadus:'tornadus-incarnate',thundurus:'thundurus-incarnate',landorus:'landorus-incarnate',keldeo:'keldeo-ordinary',meloetta:'meloetta-aria',pyroar:'pyroar-male',meowstic:'meowstic-male',aegislash:'aegislash-shield',pumpkaboo:'pumpkaboo-average',gourgeist:'gourgeist-average',zygarde:'zygarde-50',oricorio:'oricorio-baile',lycanroc:'lycanroc-midday',wishiwashi:'wishiwashi-solo',minior:'minior-red-meteor',mimikyu:'mimikyu-disguised',toxtricity:'toxtricity-amped',eiscue:'eiscue-ice',indeedee:'indeedee-male',morpeko:'morpeko-full-belly',urshifu:'urshifu-single-strike',basculegion:'basculegion-male',enamorus:'enamorus-incarnate',oinkologne:'oinkologne-male',maushold:'maushold-family-of-four',squawkabilly:'squawkabilly-green-plumage',palafin:'palafin-zero',tatsugiri:'tatsugiri-curly',dudunsparce:'dudunsparce-two-segment'
});
const title = value => value.split('-').map(word => word[0]?.toUpperCase() + word.slice(1)).join(' ');
const identities = new Set(source.map(entry => entry.pokemon));
const direct = [...identities].filter(name => POKEMON_SLUG_SET.has(name));
const legacy = [...identities].filter(name => !POKEMON_SLUG_SET.has(name));
const duplicateKeys = new Map();
for (const entry of source) duplicateKeys.set(`${entry.pokemon}\0${entry.text}`, (duplicateKeys.get(`${entry.pokemon}\0${entry.text}`) ?? 0) + 1);
const duplicatedKeys = [...duplicateKeys.values()].filter(count => count > 1);
if (raw.length !== 14496 || source.length !== 8502 || identities.size !== 1025 || direct.length !== 988 || legacy.length !== 37 || Object.keys(LEGACY_SPECIES_ROUTES).length !== 37 || duplicatedKeys.length !== 179 || duplicatedKeys.reduce((n, count) => n + count - 1, 0) !== 181) throw new Error('Dex Entries source baseline drifted; audit required.');
for (const name of legacy) {
  const target = LEGACY_SPECIES_ROUTES[name];
  if (!target || !POKEMON_SLUG_SET.has(target)) throw new Error(`Unresolved legacy Dex Entries species: ${name}`);
}

const groups = new Map();
for (const entry of source) {
  const pokemon = entry.pokemon;
  if (!groups.has(pokemon)) groups.set(pokemon, { identity:pokemon, slug: POKEMON_SLUG_SET.has(pokemon) ? pokemon : LEGACY_SPECIES_ROUTES[pokemon], displayName:title(pokemon), entries:[], byText:new Map() });
  const group = groups.get(pokemon);
  let display = group.byText.get(entry.text);
  if (!display) { display = { text:entry.text, versions:[] }; group.byText.set(entry.text, display); group.entries.push(display); }
  for (const version of entry.versions) if (!display.versions.includes(version)) display.versions.push(version);
}
export const DEX_ENTRY_CATALOG = Object.freeze([...groups.values()].map(({ byText, ...group }) => Object.freeze({ ...group, path:pokemonPath(group.slug), entries:Object.freeze(group.entries.map(Object.freeze)) })));
export const DEX_ENTRY_STATS = Object.freeze({ rawRecords:raw.length, inputBlocks:source.length, species:identities.size, direct:direct.length, legacy:legacy.length, duplicateKeys:duplicatedKeys.length, redundantBlocks:duplicatedKeys.reduce((n,count)=>n+count-1,0), normalizedBlocks:DEX_ENTRY_CATALOG.reduce((n,g)=>n+g.entries.length,0), versionAssignments:DEX_ENTRY_CATALOG.reduce((n,g)=>n+g.entries.reduce((sum,e)=>sum+e.versions.length,0),0) });
if (DEX_ENTRY_STATS.normalizedBlocks !== 8321 || DEX_ENTRY_STATS.versionAssignments !== 14496) throw new Error('Dex Entries normalization lost source assignments.');
