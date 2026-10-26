import DashboardHeader from "@/modules/Dashboard/Layout/DashboardHeader";
import DashboardFooter from "@/modules/Dashboard/Layout/DashboardFooter";
import WelcomeWidget from "@/modules/Dashboard/Widgets/WelcomeWidget";
import RecentProjectsWidget from "@/modules/Dashboard/Widgets/RecentProjectsWidget";
import RecentDocumentsWidget from "@/modules/Dashboard/Widgets/RecentDocumentsWidget";
import QuickLaunchWidget from "@/modules/Dashboard/Widgets/QuickLaunchWidget";
import SystemHealthWidget from "@/modules/Dashboard/Widgets/SystemHealthWidget";
import ActivityWidget from "@/modules/Dashboard/Widgets/ActivityWidget";
import CalendarWidget from "@/modules/Dashboard/Widgets/CalendarWidget";
import StorageWidget from "@/modules/Dashboard/Widgets/StorageWidget";
import TasksWidget from "@/modules/Dashboard/Widgets/TasksWidget";
import WeatherWidget from "@/modules/Dashboard/Widgets/WeatherWidget";

export default function DashboardPage() {
  return (
    <div
      style={{
        background: "#0B0F19",
        minHeight: "100vh",
        paddingBottom: "24px",
        color: "#E2E8F0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Page top gradient ribbon */}
      <div
        style={{
          height: "3px",
          background: "linear-gradient(90deg, #00D2FF, #05FFC4, #FFB800)",
          boxShadow: "0 2px 20px rgba(5,255,196,0.6)",
          flexShrink: 0,
        }}
      />

      <DashboardHeader />

      <main
        style={{
          maxWidth: "1600px",
          width: "100%",
          margin: "12px auto 0",
          padding: "0 16px",
          boxSizing: "border-box",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Navigation — full width, always above the fold */}
          <QuickLaunchWidget />

          {/* Welcome — full width, compact ribbon */}
          <WelcomeWidget />

          {/* Main content — 3-column masonry-style layout.
              Each column is an independent flex stack, so widgets
              pack tightly without fighting each other's heights.
              No gaps, no empty cells. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: "12px",
              alignItems: "start",
            }}
          >
            {/* Column 1 — main content (wide) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
              }}
            >
              <RecentProjectsWidget />
              <RecentDocumentsWidget />
              <TasksWidget />
            </div>

            {/* Column 2 — secondary (narrow) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
              }}
            >
              <WeatherWidget />
              <StorageWidget />
              <ActivityWidget />
            </div>

            {/* Column 3 — tertiary (narrow) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
              }}
            >
              <SystemHealthWidget />
              <CalendarWidget />
            </div>
          </div>

        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}