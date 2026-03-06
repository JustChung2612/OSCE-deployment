import { useState } from 'react';
import "./studentDashBoardPage.scss";
import StudentSidebar from './studentSidebar/StudentSidebar';
import { House, PanelsTopLeft } from 'lucide-react';
import Overview from './studentDBTab/overview/Overview';
import AiPatientTab from './studentDBTab/AiPatient/0-AiPatientTab/AiPatientTab';

const StudentDashBoardPage = () => {

 const [activeTab, setActiveTab] = useState('overview');
 const menu_items = [
    { 
      key: 'overview', 
      label: 'Tổng quan', 
      icon: <House className="sidebarIcon" />, 
      content: <Overview/> 
    },
    { 
      key: 'AiPatient', 
      label: 'Bệnh Nhân AI', 
      icon: <PanelsTopLeft 
      className="sidebarIcon" />,
      content: <AiPatientTab/> 
    },
 ] 

  const active_content_tab = menu_items.find((tab) => activeTab === tab.key ).content;


  return (
    <>
        <div className="StudentDashBoardPage" >
            <StudentSidebar menu_items={menu_items} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="student_dashboard_home">
                {active_content_tab}
            </div>

        </div>
    </>
  )
}

export default StudentDashBoardPage