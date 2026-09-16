import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import LocationDetailPage from './LocationDetailPage';
import dome from '../../public/data/locations/pokeathlon-dome.json';
import items from '../../public/data/locationItems/pokeathlon-dome.json';
import { resolveLocation } from '../utils/locationData';

const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
const robots = () => document.head.querySelector('meta[name="robots"]')?.content;
function mount(path = '/location/pokeathlon-dome', initialData) {
  return render(<MemoryRouter initialEntries={[path]}>
    <Link to="/location/not-a-real-location">Invalid</Link>
    <Link to="/location/kanto-route-2">Next location</Link>
    <Routes><Route path="/location/:locationName" element={<LocationDetailPage initialData={initialData} />} /></Routes>
  </MemoryRouter>);
}
function mockFetch(handler) {
  vi.stubGlobal('fetch', vi.fn(async url => {
    const value = await handler(url);
    return { ok: value !== null, status: value === null ? 404 : 200, text: async () => JSON.stringify(value) };
  }));
}
afterEach(() => { cleanup(); document.head.innerHTML = ''; delete window.__POKELORE_LOCATION__; vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('Location detail states', () => {
  it('resolves known canonical slugs including Pokéathlon Dome', () => {
    expect(resolveLocation('pokeathlon-dome').displayName).toBe('Pokéathlon Dome');
    expect(resolveLocation('kanto-route-2').name).toBe('kanto-route-2');
    expect(resolveLocation('not-a-real-location')).toBeNull();
    expect(resolveLocation('241')).toBeNull();
  });
  it('clears stale duplicate metadata during loading without showing a 404', () => {
    document.head.innerHTML = '<link rel="canonical" href="https://pokelore.net/old"><meta property="og:url" content="old"><meta property="og:url" content="older"><meta name="robots" content="noindex">';
    mockFetch(() => new Promise(() => {}));
    mount();
    expect(screen.getByRole('heading', { name: 'Loading location' })).toBeInTheDocument();
    expect(screen.queryByText('Location not found')).not.toBeInTheDocument();
    expect(canonical()).toBeUndefined();
    expect(document.querySelectorAll('meta[property="og:url"]')).toHaveLength(0);
    expect(robots()).not.toContain('noindex');
  });
  it('loads a valid location with canonical SEO and real shop content', async () => {
    mockFetch(url => url.includes('/locations/') ? dome : url.includes('/locationItems/') ? items : null);
    mount('/location/pokeathlon-dome?version=heartgold');
    expect(await screen.findByRole('heading', { name: 'Pokéathlon Dome' })).toBeInTheDocument();
    expect(canonical()).toBe('https://pokelore.net/location/pokeathlon-dome');
    expect(document.title).toBe('Pokéathlon Dome Guide, Items | PokéLore');
    expect(screen.getByRole('heading', { name: 'Athlete Shop' })).toBeInTheDocument();
    expect(robots()).not.toContain('noindex');
  });
  it('uses embedded prerender data without an initial network dependency', () => {
    window.__POKELORE_LOCATION__ = { location: dome, locationItems: items };
    mockFetch(() => { throw new Error('offline'); });
    mount();
    expect(screen.getByRole('heading', { name: 'Pokéathlon Dome' })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('only marks confirmed invalid slugs noindex and removes the prior canonical', async () => {
    mount('/location/pokeathlon-dome', { location: dome });
    expect(canonical()).toContain('pokeathlon-dome');
    fireEvent.click(screen.getByText('Invalid'));
    expect(await screen.findByRole('heading', { name: 'Location not found' })).toBeInTheDocument();
    expect(canonical()).toBeUndefined();
    expect(robots()).toBe('noindex, follow');
    expect(document.title).not.toContain('Pokéathlon Dome');
  });
  it.each(['network', 'missing-file', 'malformed'])('treats %s failure on a known location as unavailable and supports retry', async failure => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch(() => { if (failure === 'network') throw new Error('offline'); return failure === 'missing-file' ? null : {}; });
    mount();
    expect(await screen.findByRole('heading', { name: 'Location temporarily unavailable' })).toBeInTheDocument();
    expect(screen.queryByText('Location not found')).not.toBeInTheDocument();
    expect(canonical()).toBeUndefined();
    expect(robots()).not.toContain('noindex');
    mockFetch(url => url.includes('/locations/') ? dome : null);
    fireEvent.click(screen.getByText('Try again'));
    expect(await screen.findByRole('heading', { name: 'Pokéathlon Dome' })).toBeInTheDocument();
  });
  it('does not carry the old location into the next loading state', async () => {
    mockFetch(() => new Promise(() => {}));
    mount('/location/pokeathlon-dome', { location: dome });
    fireEvent.click(screen.getByText('Next location'));
    await waitFor(() => expect(canonical()).toBeUndefined());
    expect(screen.getByRole('heading', { name: 'Loading location' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pokéathlon Dome' })).not.toBeInTheDocument();
  });
});
