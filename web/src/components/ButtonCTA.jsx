/**
 * @file ButtonCTA.jsx
 * @description A stylized call-to-action button component.
 * It features a custom SVG icon representing a growth chart/network and is primarily used for navigation to analytics.
 *
 * @dependencies
 * - None.
 *
 * @exports ButtonCTA (default)
 * @interconnections Used in the Home page and Dashboard for prominent navigation links.
 */

function ButtonCTA(props) {
  return (
    <div id="analyticsbtn">
      <div>
        <span>{props.children}</span>
        {/* Decorative SVG representing analytical growth */}
        <svg
          width="800px"
          height="800px"
          viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="344" y1="280" x2="432" y2="192"></line>
          <line x1="232" y1="216" x2="296" y2="280"></line>
          <line x1="80" y1="320" x2="184" y2="216"></line>
          <circle cx="456" cy="168" r="24"></circle>
          <circle cx="320" cy="304" r="24"></circle>
          <circle cx="208" cy="192" r="24"></circle>
          <circle cx="56" cy="344" r="24"></circle>
        </svg>
      </div>
    </div>
  );
}

export default ButtonCTA;
