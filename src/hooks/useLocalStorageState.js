import {
  useEffect,
  useState
} from "react";

function readLocalValue(
  key,
  defaultValue
) {
  try {
    const storedValue =
      localStorage.getItem(key);

    return storedValue === null
      ? defaultValue
      : JSON.parse(storedValue);
  } catch {
    return defaultValue;
  }
}

function useLocalStorageState(
  key,
  defaultValue
) {
  const [value, setValue] =
    useState(() =>
      readLocalValue(
        key,
        defaultValue
      )
    );

  useEffect(() => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch {
      // Local storage can fail in private browsing or strict browser settings.
    }
  }, [
    key,
    value
  ]);

  useEffect(() => {
    function handleStorage(event) {
      if (
        event.storageArea !==
          localStorage ||
        event.key !== key
      ) {
        return;
      }

      try {
        setValue(
          event.newValue === null
            ? defaultValue
            : JSON.parse(event.newValue)
        );
      } catch {
        setValue(defaultValue);
      }
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [
    defaultValue,
    key
  ]);

  return [
    value,
    setValue
  ];
}

export default useLocalStorageState;
