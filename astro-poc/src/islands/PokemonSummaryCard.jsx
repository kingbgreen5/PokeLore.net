import TypeBadge from './TypeBadge.jsx';

export default function PokemonSummaryCard({ pokemon }) {
  return <a className="pokemon-summary-card" href={`/pokemon/${pokemon.name}`}>
    <span className="dex-number">#{String(pokemon.id).padStart(4, '0')}</span>
    <img className="card-artwork" src={pokemon.cardSprite} alt={pokemon.displayName} width="90" height="90" loading="lazy" />
    <strong>{pokemon.displayName}</strong>
    <span className="card-types">
      {pokemon.types.map(type => <TypeBadge key={type} type={type} height="1.15rem" />)}
    </span>
  </a>;
}
