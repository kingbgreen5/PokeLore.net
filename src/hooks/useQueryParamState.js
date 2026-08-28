import { useSearchParams } from "react-router-dom";

function useQueryParamState(
  paramName,
  defaultValue = ""
) {
  const [
    searchParams,
    setSearchParams
  ] = useSearchParams();

  const value =
    searchParams.get(paramName) ??
    defaultValue;

  function setValue(nextValue) {
    const currentSearch =
      typeof window === "undefined"
        ? searchParams
        : window.location.search;
    const params = new URLSearchParams(
      currentSearch
    );

    const resolvedValue =
      typeof nextValue ===
      "function"
        ? nextValue(
            params.get(paramName) ??
              defaultValue
          )
        : nextValue;

    if (
      resolvedValue === defaultValue ||
      resolvedValue === "" ||
      resolvedValue === null ||
      resolvedValue === undefined
    ) {
      params.delete(paramName);
    } else {
      params.set(paramName, resolvedValue);
    }

    setSearchParams(params, { replace: true });
  }

  return [
    value,
    setValue
  ];
}

export default useQueryParamState;
