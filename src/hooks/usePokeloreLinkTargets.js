import {
  useEffect,
  useState
} from "react";

let linkTargetsPromise = null;

async function fetchLinkTargets() {
  const response = await fetch(
    "/data/pokeloreLinkTargets.json"
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load PokeLore link targets"
    );
  }

  return response.json();
}

export default function usePokeloreLinkTargets(
  initialTargets = []
) {
  const [targets, setTargets] =
    useState(() =>
      Array.isArray(initialTargets)
        ? initialTargets
        : []
    );

  useEffect(() => {
    let isActive = true;

    linkTargetsPromise ??= fetchLinkTargets();

    linkTargetsPromise
      .then(data => {
        if (!isActive) return;
        setTargets(
          Array.isArray(data) ? data : []
        );
      })
      .catch(error => {
        if (!isActive) return;
        console.warn(
          "Failed to load PokeLore link targets:",
          error
        );
        setTargets([]);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return targets;
}
