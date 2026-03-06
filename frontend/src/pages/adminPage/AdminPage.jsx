import "./adminPage.scss";
import { useState, useMemo } from 'react';
import Sidebar from '../../components/sidebar/Sidebar.jsx';
import AdminNavbar from '../../components/adminNavbar/AdminNavbar.jsx';

// ADMIN TAB //
import PatientCaseList from './adminTab/patientCaseList/PatientCaseList.jsx';
import CreateRoomPopup from './adminTab/roomPopup/RoomPopup.jsx';
import ExamRoomList from './adminTab/examRoomList/ExamRoomList.jsx';
import StudentLists from './adminTab/studentLists/StudentLists.jsx';
import InstructorExams from './adminTab/InstructorExams/InstructorExams.jsx';

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState('patientCase');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // 🆕 Popup control
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const handleStartRoom = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);

  const handleCancelRoom = () => {
    console.log('🗑️ Room creation cancelled');
    setIsPopupOpen(false);
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleFinishRoom = (stations) => {
    // ✅ Simplified: only close popup and reset selection
    console.log('✅ Room creation finished (UI only). Stations draft:', stations);
    setIsPopupOpen(false);
    setSelectionMode(false);
    setSelectedIds([]);
    // TODO: later integrate backend save logic
  };

  // Toggle selection logic
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleStartSelection = () => {
    setActiveSection('patientCase');
    setSelectionMode(true);
    setSelectedIds([]);
  };

  const handleCompleteSelection = () => {
    if (selectedIds.length === 0) return;
    console.log('✅ Completed selection:', selectedIds);
    setSelectionMode(false);
    setSelectedIds([]);
  };

  
  const sectionComponents = useMemo(
    () => ({
      patientCase: (
        <PatientCaseList
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
        />
      ),
      examRoom: <ExamRoomList/>, 
      studentLists: <StudentLists />,   
      examRoom_Taking_Place: <InstructorExams />,
      
    }),
    [selectionMode, selectedIds]
  );

  return (
    <>
      <div className="AdminPageHome">
        <Sidebar active={activeSection} onSelect={setActiveSection} />

        <div className={`homeContainer ${isPopupOpen ? 'popup-open' : ''}`}>
          <AdminNavbar
            selectionMode={selectionMode}
            selectedCount={selectedIds.length}
            onStartSelection={handleStartSelection}
            onCompleteSelection={handleCompleteSelection}
            onStartRoom={handleStartRoom}
          />

          {sectionComponents[activeSection] || sectionComponents.patientCase}
        </div>
      </div>

      <CreateRoomPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        onCancelRoom={handleCancelRoom}
        onFinishRoom={handleFinishRoom}
        onAddPatientToStation={(patient, index) => {
          console.log(`➕ Added patient to station ${index + 1}`, patient);
        }}
        setActiveSection={setActiveSection} // move to ExamRoomList after create exam room
      />
    </>
  );
};

export default AdminPage;
