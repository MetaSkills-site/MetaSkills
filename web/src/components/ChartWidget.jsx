/**
 * @file ChartWidget.jsx
 * @description Standardized container wrapping Chart.js visualizations with titles, tooltips, and empty states.
 * @architecture View layer presentation widget consumed by analytics dashboards and administrative report views.
 * @agent_note Deep merges configuration options with system typography and tooltip defaults to maintain UI consistency.
 */

/**
 * FILE PURPOSE: ChartWidget — A standardized container for Chart.js visualizations.
 *
 * ROLE:
 * Wraps various Chart.js types (Line, Bar, Doughnut, etc.) in a consistent,
 * stylized container with a title, subtitle, info tooltips, and empty states.
 * It manages global Chart.js defaults to ensure a cohesive visual language
 * throughout the application.
 *
 * DEPENDENCIES:
 * - chart.js: The core rendering engine for 2D charts.
 * - react-chartjs-2: React wrapper components for Chart.js.
 * - styled-components: For layout, shadows, and responsive height management.
 * - InfoTooltip: For providing contextual help for complex metrics.
 *
 * EXPORTS:
 * - ChartWidget (default): The functional wrapper for charts.
 *
 * INTERCONNECTIONS:
 * - Extensively used in the Analytics page and Admin Dashboard.
 */
import styled from "styled-components";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  BubbleController,
  ScatterController,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut, Radar, Scatter, Bubble } from "react-chartjs-2";
import InfoTooltip from "./InfoTooltip";

// Centralized ChartJS Registration
ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  BubbleController,
  ScatterController,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

/* ─── Global Styling Defaults ─── */
ChartJS.defaults.font.family = "'Inter', 'Roboto', 'Quicksand', sans-serif";
ChartJS.defaults.color = "#888";
ChartJS.defaults.scale.grid.color = "#f0f0f0";

/* ─── Styled Components ─── */

const ChartContainer = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  border: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
`;

const ChartHeader = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 15px;

  h2 {
    font-size: 1.4rem;
    color: #333;
    margin: 0 0 5px 0;
  }
  p {
    font-size: 0.95rem;
    color: #666;
    margin: 0;
  }
`;

const ChartBody = styled.div`
  height: ${(props) => props.$height || "300px"};
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const EmptyText = styled.div`
  color: #888;
  text-align: center;
  padding: 0 20px;
`;

/* ─── Utility Logic ─── */

/**
 * mergeOptions
 * Deep merges default chart settings with component-level overrides.
 * This ensures common styling (like tooltips) persists unless explicitly changed.
 */
function mergeOptions(defaults, custom) {
  if (!custom) return defaults;
  const result = { ...defaults };
  for (const key in custom) {
    if (
      custom[key] &&
      typeof custom[key] === "object" &&
      !Array.isArray(custom[key]) &&
      typeof custom[key] !== "function"
    ) {
      result[key] = mergeOptions(result[key] || {}, custom[key]);
    } else {
      result[key] = custom[key];
    }
  }
  return result;
}

/* ─── Configuration Defaults ─── */

const defaultTooltipOpts = {
  backgroundColor: "#ffffff",
  titleColor: "#333333",
  bodyColor: "#555555",
  borderColor: "#e2e8f0",
  borderWidth: 1,
  padding: 12,
  displayColors: true,
  usePointStyle: true,
  cornerRadius: 8,
  titleFont: { size: 14, weight: "bold" },
  bodyFont: { size: 13 },
};

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: defaultTooltipOpts,
    legend: {
      labels: {
        usePointStyle: true,
        font: { size: 13 },
      },
    },
  },
};

/* ─── Main Component ─── */

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {string} [props.title] - Widget header title.
 * @param {string} [props.subtitle] - Widget header explanatory subtitle.
 * @param {string} [props.infoText] - Contextual explanation text shown inside an info tooltip.
 * @param {string} [props.type="line"] - Chart.js chart type (e.g., 'line', 'bar', 'doughnut', 'radar', 'scatter', 'bubble').
 * @param {Object} props.data - Chart.js datasets and labels configuration object.
 * @param {Object} [props.options={}] - Custom Chart.js option overrides merged with defaults.
 * @param {string} [props.height="300px"] - Height value applied to chart rendering canvas wrapper.
 * @param {boolean} [props.isEmpty=false] - Whether data is insufficient or empty.
 * @param {string} [props.emptyMessage="Not enough data to display."] - Text message displayed when isEmpty is true.
 * @param {React.ReactNode} [props.headerAccessory=null] - Optional JSX element mounted in the header corner.
 * @param {Object} [props.containerStyle={}] - Additional inline styles applied to root card container.
 * @param {Object} [props.bodyStyle={}] - Additional inline styles applied to the chart body container.
 * @returns {JSX.Element} The rendered chart card container.
 */
export default function ChartWidget({
  title,
  subtitle,
  infoText,
  type = "line",
  data,
  options = {},
  height = "300px",
  isEmpty = false,
  emptyMessage = "Not enough data to display.",
  headerAccessory = null,
  containerStyle = {},
  bodyStyle = {},
}) {
  const mergedOptions = mergeOptions(defaultOptions, options);

  /**
   * renderChart Logic
   * Dynamically switches between Chart.js component types based on the 'type' prop.
   */
  const renderChart = () => {
    if (isEmpty) {
      return <EmptyText>{emptyMessage}</EmptyText>;
    }

    switch (type.toLowerCase()) {
      case "line":
        return <Line data={data} options={mergedOptions} />;
      case "bar":
        return <Bar data={data} options={mergedOptions} />;
      case "doughnut":
        return <Doughnut data={data} options={mergedOptions} />;
      case "radar":
        return <Radar data={data} options={mergedOptions} />;
      case "scatter":
        return <Scatter data={data} options={mergedOptions} />;
      case "bubble":
        return <Bubble data={data} options={mergedOptions} />;
      default:
        return null;
    }
  };

  return (
    <ChartContainer style={containerStyle}>
      {(title || subtitle || headerAccessory) && (
        <ChartHeader>
          <div>
            {title && (
              <h2 style={{ display: "flex", alignItems: "center" }}>
                {title}
                {infoText && <InfoTooltip text={infoText} />}
              </h2>
            )}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {headerAccessory}
        </ChartHeader>
      )}
      <ChartBody $height={height} style={bodyStyle}>
        {renderChart()}
      </ChartBody>
    </ChartContainer>
  );
}
