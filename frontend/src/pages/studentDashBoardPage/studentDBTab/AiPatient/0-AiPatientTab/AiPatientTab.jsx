import { useState } from "react";
import AiPatientListTab from "../1-AiPatientListTab/AiPatientListTab";
import AiPatientDetailTab from "../2-AiPatientDetailTab/AiPatientDetailTab";
import AiPatientInteractionTab from "../3-AiPatientInteractionTab/AiPatientInteractionTab";

export default function AiPatientTab() {
  // "list" | "detail" | "interaction"
  const [view, setView] = useState("list");
  const [selectedStationId, setSelectedStationId] = useState(null);

  // From list -> detail
  const handleOpenStation = (stationId) => {
    setSelectedStationId(stationId);
    setView("detail");
  };

  // From detail -> interaction
  const handleStartPractice = (stationId) => {
    setSelectedStationId(stationId);
    setView("interaction");
  };

  // Back behavior
  const backToList = () => {
    setSelectedStationId(null);
    setView("list");
  };

  const backToDetail = () => {
    setView("detail");
  };

  if (view === "interaction") {
    return (
      <AiPatientInteractionTab
        stationId={selectedStationId}
        onBack={backToDetail}
      />
    );
  }

  if (view === "detail") {
    return (
      <AiPatientDetailTab
        stationId={selectedStationId}
        onBack={backToList}
        onStartPractice={handleStartPractice}
      />
    );
  }

  // default: list
  return <AiPatientListTab onOpenStation={handleOpenStation} />;
}
