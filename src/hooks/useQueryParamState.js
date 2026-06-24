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
    setSearchParams(
      currentParams => {
        const params =
          new URLSearchParams(
            currentParams
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
          resolvedValue ===
            defaultValue ||
          resolvedValue === "" ||
          resolvedValue === null ||
          resolvedValue === undefined
        ) {
          params.delete(paramName);
        } else {
          params.set(
            paramName,
            resolvedValue
          );
        }

        return params;
      },
      { replace: true }
    );
  }

  return [
    value,
    setValue
  ];
}

export default useQueryParamState;
