// ClubConnector Gym Capacity Widget for Scriptable
// Author: @v1lling
// Version: 1.0.0
// License: MIT
//
// Zeigt die aktuelle Auslastung deines Fitnessstudios an,
// das die ClubConnector App verwendet.
//
// Installation:
// 1. Kopiere dieses gesamte Skript in ein neues Scriptable-Skript
// 2. Passe die Konfiguration unten an deine Bedürfnisse an
// 3. Füge das Widget zum Home Screen hinzu und wähle dieses Skript aus

// ========================================
// KONFIGURATION - Passe diese Werte an!
// ========================================

const CONFIG = {
  // Clubname - Wird im Widget angezeigt
  clubName: "ClubConnector",

  // API Konfiguration - Diese Werte musst du über einen HTTPS-Proxy ermitteln
  // Siehe README für Anleitung
  api: {
    url: "https://YOUR_INSTANCE.sovd.cloud/api/app/content/Capacity",
    bearerToken: "Bearer YOUR_TOKEN_HERE",
    appId: "YOUR_APP_ID_HERE",
    deviceId: "YOUR_DEVICE_ID_HERE",
    standortId: "YOUR_STANDORT_ID_HERE",
    appVersion: "2.0.1",
    platform: "iOS"
  },

  // Auslastungsschwellen (Anzahl Besucher)
  thresholds: {
    low: 40,     // Unter diesem Wert: Niedrige Auslastung (grün)
    medium: 90   // Unter diesem Wert: Mittlere Auslastung (gelb)
                 // Darüber: Hohe Auslastung (rot)
  },

  // Farben für das Widget
  colors: {
    gradientStart: "#667eea",
    gradientEnd: "#764ba2",
    currentHourBar: "#FEC503",
    normalBar: "#ffffff"
  },

  // Widget-Texte
  labels: {
    visitors: "Besucher",
    average: "Durchschnitt",
    errorMessage: "❌ Fehler beim Laden",
    lowCapacity: "Niedrig",
    mediumCapacity: "Mittel",
    highCapacity: "Hoch",
    dayOverview: "24-Stunden Übersicht"
  }
};

// ========================================
// WIDGET CODE - Ab hier nichts ändern
// ========================================

// Fetch gym capacity data
async function fetchGymData() {
  const req = new Request(CONFIG.api.url);
  req.headers = {
    "Accept": "*/*",
    "Authorization": CONFIG.api.bearerToken,
    "x-app-id": CONFIG.api.appId,
    "x-platform": CONFIG.api.platform,
    "x-device-id": CONFIG.api.deviceId,
    "x-standort-id": CONFIG.api.standortId,
    "x-app-version": CONFIG.api.appVersion,
    "User-Agent": "ClubConnector-Scriptable/1.0"
  };

  try {
    const response = await req.loadJSON();
    return parseGymData(response);
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

// Parse the API response
function parseGymData(data) {
  const body = data.content?.body || [];

  // Extract current visitors
  let currentVisitors = 0;
  let averageVisitors = 0;

  if (body[0]?.htmlText) {
    const match = body[0].htmlText.match(/>(\d+)</);
    if (match) currentVisitors = parseInt(match[1]);
  }

  if (body[1]?.htmlText) {
    const match = body[1].htmlText.match(/<strong>(\d+)<\/strong>/);
    if (match) averageVisitors = parseInt(match[1]);
  }

  // Extract chart data
  let chartData = [];
  if (body[2]?.chartEntries) {
    chartData = body[2].chartEntries.map((entry, index) => ({
      hour: index,
      value: entry.value,
      isCurrentHour: entry.color === "#FEC503"
    }));
  }

  return {
    current: currentVisitors,
    average: averageVisitors,
    chartData: chartData,
    timestamp: new Date()
  };
}

// Determine capacity status and color
function getCapacityStatus(visitors) {
  if (visitors < CONFIG.thresholds.low) {
    return {
      status: CONFIG.labels.lowCapacity,
      color: new Color("#4caf50"),
      emoji: "🟢"
    };
  } else if (visitors < CONFIG.thresholds.medium) {
    return {
      status: CONFIG.labels.mediumCapacity,
      color: new Color("#ff9800"),
      emoji: "🟡"
    };
  } else {
    return {
      status: CONFIG.labels.highCapacity,
      color: new Color("#f44336"),
      emoji: "🔴"
    };
  }
}

// Create small widget
function createSmallWidget(data) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#ffffff");

  if (!data) {
    const errorText = widget.addText(CONFIG.labels.errorMessage);
    errorText.textColor = Color.red();
    return widget;
  }

  const status = getCapacityStatus(data.current);

  // Gradient background
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color(CONFIG.colors.gradientStart),
    new Color(CONFIG.colors.gradientEnd)
  ];
  widget.backgroundGradient = gradient;

  // Current visitors
  const currentStack = widget.addStack();
  currentStack.layoutVertically();

  const titleText = currentStack.addText(CONFIG.clubName.toUpperCase());
  titleText.font = Font.boldSystemFont(12);
  titleText.textColor = Color.white();

  currentStack.addSpacer(8);

  const visitorText = currentStack.addText(`${data.current}`);
  visitorText.font = Font.boldSystemFont(36);
  visitorText.textColor = Color.white();

  const labelText = currentStack.addText(CONFIG.labels.visitors);
  labelText.font = Font.systemFont(14);
  labelText.textColor = Color.white();
  labelText.textOpacity = 0.9;

  currentStack.addSpacer(8);

  const statusStack = currentStack.addStack();
  const emojiText = statusStack.addText(status.emoji);
  emojiText.font = Font.systemFont(14);
  statusStack.addSpacer(4);
  const statusText = statusStack.addText(status.status);
  statusText.font = Font.systemFont(12);
  statusText.textColor = Color.white();

  widget.addSpacer();

  // Update time
  const timeText = widget.addText(formatTime(data.timestamp));
  timeText.font = Font.systemFont(10);
  timeText.textColor = Color.white();
  timeText.textOpacity = 0.7;

  return widget;
}

// Create medium widget with chart (6 AM - 11 PM)
function createMediumWidget(data) {
  const widget = new ListWidget();

  if (!data) {
    widget.backgroundColor = Color.white();
    const errorText = widget.addText(CONFIG.labels.errorMessage);
    errorText.textColor = Color.red();
    return widget;
  }

  // Gradient background
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color(CONFIG.colors.gradientStart),
    new Color(CONFIG.colors.gradientEnd)
  ];
  widget.backgroundGradient = gradient;

  // Proper padding for medium widget with optimized chart width
  widget.setPadding(4, 8, 4, 8);

  // Header row with better separation
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();

  // Left: Club title
  const titleText = headerStack.addText(CONFIG.clubName);
  titleText.font = Font.boldSystemFont(18);
  titleText.textColor = Color.white();

  headerStack.addSpacer();

  // Center: Current visitors with status
  const centerStack = headerStack.addStack();
  centerStack.layoutHorizontally();
  centerStack.centerAlignContent();

  const visitorText = centerStack.addText(`${data.current}`);
  visitorText.font = Font.boldSystemFont(22);
  visitorText.textColor = Color.white();

  centerStack.addSpacer(4);

  const status = getCapacityStatus(data.current);
  const statusText = centerStack.addText(`${status.emoji} ${status.status}`);
  statusText.font = Font.systemFont(12);
  statusText.textColor = Color.white();
  statusText.textOpacity = 0.9;

  headerStack.addSpacer();

  // Right: Average and time
  const rightStack = headerStack.addStack();
  rightStack.layoutVertically();

  const avgText = rightStack.addText(`Ø ${data.average}`);
  avgText.font = Font.systemFont(11);
  avgText.textColor = Color.white();
  avgText.textOpacity = 0.9;
  avgText.rightAlignText();

  const timeText = rightStack.addText(formatTime(data.timestamp));
  timeText.font = Font.systemFont(10);
  timeText.textColor = Color.white();
  timeText.textOpacity = 0.7;
  timeText.rightAlignText();

  widget.addSpacer(4);

  // Chart container
  const chartContainer = widget.addStack();
  chartContainer.layoutVertically();
  chartContainer.spacing = 1;

  // Values row
  const valuesStack = chartContainer.addStack();
  valuesStack.layoutHorizontally();
  valuesStack.spacing = 0.8;

  // Chart bars
  const chartStack = chartContainer.addStack();
  chartStack.layoutHorizontally();
  chartStack.spacing = 0.8;

  // Time labels
  const labelsStack = chartContainer.addStack();
  labelsStack.layoutHorizontally();
  labelsStack.spacing = 0.8;

  // Filter chart data for hours 6-23 (18 hours)
  const filteredData = data.chartData.slice(6, 24); // Hours 6-23
  const maxValue = Math.max(...filteredData.map(d => d.value));

  // Optimized bar width with visible spacing and full coverage
  const barWidth = 16;

  filteredData.forEach((item, index) => {
    const actualHour = index + 6; // Convert back to actual hour

    // Value label - show every 2nd hour
    const valueContainer = valuesStack.addStack();
    valueContainer.size = new Size(barWidth, 10);

    if (actualHour % 2 === 0 || item.isCurrentHour) {
      const valueText = valueContainer.addText(`${item.value}`);
      valueText.font = Font.systemFont(6);
      valueText.textColor = item.isCurrentHour ? new Color(CONFIG.colors.currentHourBar) : Color.white();
      valueText.textOpacity = item.isCurrentHour ? 1 : 0.8;
      valueText.centerAlignText();
    }

    // Bar
    const barStack = chartStack.addStack();
    barStack.layoutVertically();
    barStack.size = new Size(barWidth, 78);

    const height = maxValue > 0 ? (item.value / maxValue) * 74 : 0;
    barStack.addSpacer(74 - height);

    if (height > 0) {
      const bar = barStack.addStack();
      bar.size = new Size(barWidth - 2, height);

      // Simple color: current hour highlighted, rest in white
      if (item.isCurrentHour) {
        bar.backgroundColor = new Color(CONFIG.colors.currentHourBar, 0.9);
        bar.borderColor = Color.white();
        bar.borderWidth = 1;
      } else {
        bar.backgroundColor = new Color(CONFIG.colors.normalBar, 0.8);
      }

      bar.cornerRadius = 1;
    }

    // Time label - show every 2 hours
    const labelContainer = labelsStack.addStack();
    labelContainer.size = new Size(barWidth, 8);

    if (actualHour % 2 === 0) {
      const hourText = labelContainer.addText(`${actualHour}`);
      hourText.font = Font.boldSystemFont(6);
      hourText.textColor = item.isCurrentHour ? new Color(CONFIG.colors.currentHourBar) : Color.white();
      hourText.textOpacity = item.isCurrentHour ? 1 : 0.8;
      hourText.centerAlignText();
    }
  });

  return widget;
}

// Create large widget with full 24-hour chart
function createLargeWidget(data) {
  const widget = new ListWidget();

  if (!data) {
    widget.backgroundColor = Color.white();
    const errorText = widget.addText(CONFIG.labels.errorMessage);
    errorText.textColor = Color.red();
    return widget;
  }

  // Gradient background
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color(CONFIG.colors.gradientStart),
    new Color(CONFIG.colors.gradientEnd)
  ];
  widget.backgroundGradient = gradient;

  // Header with center alignment for better vertical alignment
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();

  const titleStack = headerStack.addStack();
  titleStack.layoutVertically();

  const titleText = titleStack.addText(CONFIG.clubName.toUpperCase());
  titleText.font = Font.boldSystemFont(18);
  titleText.textColor = Color.white();

  const subtitleText = titleStack.addText(CONFIG.labels.dayOverview);
  subtitleText.font = Font.systemFont(12);
  subtitleText.textColor = Color.white();
  subtitleText.textOpacity = 0.9;

  // Status indicator moved to left side for cleaner layout
  titleStack.addSpacer(4);
  const status = getCapacityStatus(data.current);
  const statusText = titleStack.addText(status.emoji + " " + status.status);
  statusText.font = Font.systemFont(12);
  statusText.textColor = Color.white();

  headerStack.addSpacer();

  // Current capacity - center aligned with header
  const capacityStack = headerStack.addStack();
  capacityStack.layoutVertically();
  capacityStack.centerAlignContent();

  const visitorText = capacityStack.addText(`${data.current}`);
  visitorText.font = Font.boldSystemFont(48);
  visitorText.textColor = Color.white();
  visitorText.rightAlignText();

  const labelText = capacityStack.addText(CONFIG.labels.visitors);
  labelText.font = Font.systemFont(14);
  labelText.textColor = Color.white();
  labelText.rightAlignText();

  widget.addSpacer(8);

  // Chart container
  const chartContainer = widget.addStack();
  chartContainer.layoutVertically();
  chartContainer.spacing = 2;

  // Values row
  const valuesStack = chartContainer.addStack();
  valuesStack.layoutHorizontally();
  valuesStack.spacing = 1.5;

  // Chart bars
  const chartStack = chartContainer.addStack();
  chartStack.layoutHorizontally();
  chartStack.spacing = 1.5;

  // Time labels
  const labelsStack = chartContainer.addStack();
  labelsStack.layoutHorizontally();
  labelsStack.spacing = 1.5;

  // Filter chart data for hours 6-23 (18 hours) - same as medium widget
  const filteredData = data.chartData.slice(6, 24); // Hours 6-23
  const maxValue = Math.max(...filteredData.map(d => d.value));

  // Slimmer bar width with more spacing for better visual design
  const barWidth = 14;

  filteredData.forEach((item, index) => {
    const hour = index + 6; // Convert back to actual hour
    // Value label - show every 2nd hour for better readability
    const valueContainer = valuesStack.addStack();
    valueContainer.size = new Size(barWidth, 14);

    if (hour % 2 === 0 || item.isCurrentHour) {
      const valueText = valueContainer.addText(`${item.value}`);
      valueText.font = Font.systemFont(7);
      valueText.textColor = item.isCurrentHour ? new Color(CONFIG.colors.currentHourBar) : Color.white();
      valueText.textOpacity = item.isCurrentHour ? 1 : 0.8;
      valueText.centerAlignText();
    }

    // Bar
    const barStack = chartStack.addStack();
    barStack.layoutVertically();
    barStack.size = new Size(barWidth, 130);

    const height = maxValue > 0 ? (item.value / maxValue) * 125 : 0;
    barStack.addSpacer(125 - height);

    if (height > 0) {
      const bar = barStack.addStack();
      bar.size = new Size(barWidth - 1, height);

      // Simple color: current hour highlighted, rest in white
      if (item.isCurrentHour) {
        bar.backgroundColor = new Color(CONFIG.colors.currentHourBar, 0.9);
        bar.borderColor = Color.white();
        bar.borderWidth = 1;
      } else {
        bar.backgroundColor = new Color(CONFIG.colors.normalBar, 0.8);
      }

      bar.cornerRadius = 2;
    }

    // Time label
    const labelContainer = labelsStack.addStack();
    labelContainer.size = new Size(barWidth, 10);

    // Show hour labels every 2 hours to fit better
    if (hour % 2 === 0) {
      const hourText = labelContainer.addText(`${hour}`);
      hourText.font = Font.boldSystemFont(7);
      hourText.textColor = item.isCurrentHour ? new Color(CONFIG.colors.currentHourBar) : Color.white();
      hourText.textOpacity = item.isCurrentHour ? 1 : 0.8;
      hourText.centerAlignText();
    }
  });

  widget.addSpacer(6);

  // Footer - more compact
  const footerStack = widget.addStack();
  footerStack.layoutHorizontally();

  const avgText = footerStack.addText(`${CONFIG.labels.average}: ${data.average} Personen`);
  avgText.font = Font.systemFont(10);
  avgText.textColor = Color.white();
  avgText.textOpacity = 0.8;

  footerStack.addSpacer();

  const updateText = footerStack.addText(`${formatTime(data.timestamp)}`);
  updateText.font = Font.systemFont(10);
  updateText.textColor = Color.white();
  updateText.textOpacity = 0.7;

  return widget;
}

// Format time for display
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Main execution
async function main() {
  const data = await fetchGymData();

  // Check widget size
  const widget = config.widgetFamily
    ? config.widgetFamily === "small"
      ? createSmallWidget(data)
      : config.widgetFamily === "medium"
      ? createMediumWidget(data)
      : createLargeWidget(data)
    : createMediumWidget(data); // Default for in-app preview

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // Show preview in app
    if (data) {
      const alert = new Alert();
      alert.title = CONFIG.clubName;
      alert.message = `Aktuelle Besucher: ${data.current}\n${CONFIG.labels.average}: ${data.average}\n\nWidget wurde eingerichtet! Füge es zum Homescreen hinzu.`;
      alert.addAction("OK");
      await alert.present();
    }
    widget.presentMedium();
  }

  Script.complete();
}

await main();