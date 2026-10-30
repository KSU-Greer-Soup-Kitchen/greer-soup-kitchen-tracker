// simple line icons

const PATHS: Record<string, string> = {
  hands:
    "M7 11V6.5a1.5 1.5 0 0 1 3 0V10m0-3.5v-2a1.5 1.5 0 0 1 3 0V10m0-4a1.5 1.5 0 0 1 3 0v4m0-2.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1.5a6 6 0 0 1-4.6-2.2L3.3 15.6a1.6 1.6 0 0 1 2.4-2.1L7 15",
  heart:
    "M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.6 4 7.1 4c2 0 3.5 1.1 4.9 2.9C13.4 5.1 14.9 4 16.9 4c3.5 0 5.5 3.4 4.3 6.7C19.5 15.4 12 20 12 20z",
  home: "M3 11.5 12 4l9 7.5M5.5 9.5V20h4.5v-6h4v6h4.5V9.5",
  dashboard: "M4 4h7v8H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 14h7v6H4z",
  users:
    "M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 20v-1.5a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8",
  gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7s-1.5-4-4.5-4a2 2 0 0 0 0 4M12 7s1.5-4 4.5-4a2 2 0 0 1 0 4",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.3 9a2.8 2.8 0 0 1 5.4 1c0 1.8-2.7 2.5-2.7 4M12 17.5h.01",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h11",
  phone:
    "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  pin: "M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
};

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
