import {Link} from "react-router-dom";


const StudentSidebar = ({menu_items, activeTab, setActiveTab}) => {
  return (
    <>
    <div className="sidebar student-sidebar">
      <div className="center">
          <ul>
            {menu_items?.map((item, index) => (
              <li
                key={index}
                onClick={() => setActiveTab(item.key) }
                className={`${activeTab === item.key ? 'chosen' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
      </div>

    </div>
    </>
  )
}

export default StudentSidebar