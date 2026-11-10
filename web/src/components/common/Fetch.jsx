/**
 * @file Fetch.jsx
 * @description Declarative render-prop component wrapping the useFetch hook.
 * Enables components to consume API data declaratively without directly
 * managing hook state or imperative execute() calls.
 *
 * USAGE:
 * ```jsx
 * <Fetch endpointId="getQuizHistory" onMountExecute>
 *   {({ data, loading, error, execute }) => (
 *     loading ? <Spinner /> : <DataView data={data} />
 *   )}
 * </Fetch>
 * ```
 *
 * @dependencies
 * - useFetch: Centralized data-fetching hook.
 *
 * @exports Fetch (default)
 * @interconnections Consumes src/hooks/useFetch.js. Used by components
 *   that prefer declarative data fetching over imperative hook calls.
 */

import { useEffect, useRef } from "react";
import useFetch from "../../hooks/useFetch";

const EMPTY_PARAMS = Object.freeze({});
const EMPTY_OPTIONS = Object.freeze({});

/**
 * Fetch — Declarative data fetching via render props.
 *
 * @param {Object} props
 * @param {string} props.endpointId — Key from API_ENDPOINTS.
 * @param {Object} [props.params={}] — Default params passed to useFetch.
 * @param {Object} [props.options={}] — Hook options (lazy, retries, retryDelay).
 * @param {boolean} [props.onMountExecute=false] — If true, fires execute() on mount.
 * @param {Function} props.children — Render prop receiving { data, loading, error, execute }.
 */
export default function Fetch({
  endpointId,
  params = EMPTY_PARAMS,
  options = EMPTY_OPTIONS,
  children,
  onMountExecute = false,
}) {
  const { data, loading, error, execute } = useFetch(
    endpointId,
    params,
    options,
  );

  // Track whether the initial mount execution has fired to prevent re-triggering
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (onMountExecute && !hasFiredRef.current) {
      hasFiredRef.current = true;
      // Errors are surfaced via the `error` state — no need to catch here
      execute().catch(() => {});
    }
  }, [onMountExecute, execute]);

  return children({ data, loading, error, execute });
}
