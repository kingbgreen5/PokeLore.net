import {
  useEffect,
  useState
} from "react";

function readSessionValue(
  key,
  defaultValue
) {
  try {
    const storedValue =
      sessionStorage.getItem(key);

    if (storedValue === null) {
      return defaultValue;
    }

    return JSON.parse(storedValue);
  } catch {
    return defaultValue;
  }
}

function useSessionState(
  key,
  defaultValue
) {
  const [value, setValue] =
    useState(() =>
      readSessionValue(
        key,
        defaultValue
      )
    );

  useEffect(() => {
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch {
      // Session storage can fail in private browsing or strict browser settings.
    }
  }, [
    key,
    value
  ]);

  return [
    value,
    setValue
  ];
}

export default useSessionState;
